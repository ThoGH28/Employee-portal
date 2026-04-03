"""
Views for semantic search
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from apps.documents.models import DocumentAccessLog

logger = logging.getLogger(__name__)


class SemanticSearchViewSet(viewsets.ViewSet):
    """
    API endpoint for semantic search across documents
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        Perform search across company documents (GET /api/search/?query=...&limit=...&offset=...)
        Tries semantic/vector search first, falls back to SQL text search.
        Returns PaginatedResponse compatible format: {count, results}
        """
        query = request.query_params.get('query', '').strip()
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        threshold = float(request.query_params.get('threshold', 0.3))

        if not query:
            return Response({'count': 0, 'results': []}, status=status.HTTP_200_OK)

        from apps.documents.models import Document

        formatted_results = []
        used_vector_db = False

        # Try vector DB search first
        try:
            from utils.vector_db import VectorDB
            vector_db = VectorDB()
            raw_results = vector_db.search(query, top_k=limit + offset, threshold=threshold)

            for result in raw_results:
                doc_id = result.get('id', '')
                formatted_results.append({
                    'id': doc_id,
                    'document_id': doc_id,
                    'title': result.get('title', ''),
                    'snippet': result.get('excerpt', result.get('content', '')[:300]),
                    'relevance_score': round(result.get('relevance_score', 0), 4),
                    'matched_text': result.get('excerpt', result.get('content', '')[:300]),
                })

            used_vector_db = True
            logger.info(f"Vector search by {request.user.username}: '{query}' -> {len(formatted_results)} results")

        except Exception as e:
            logger.warning(f"Vector DB search failed, falling back to SQL: {e}")

        # Fallback: SQL text search if vector DB returned nothing or failed
        if not formatted_results:
            from django.db.models import Q
            user = request.user
            if user.role in ['admin', 'hr']:
                qs = Document.objects.all()
            else:
                dept = user.get_department()
                if dept:
                    qs = Document.objects.filter(
                        Q(department=dept) | Q(department='company')
                    )
                else:
                    qs = Document.objects.filter(department='company')

            qs = qs.filter(
                Q(title__icontains=query) |
                Q(description__icontains=query) |
                Q(extracted_text__icontains=query)
            ).distinct()

            for doc in qs:
                text = doc.extracted_text or doc.description or ''
                # Find a relevant snippet around the query term
                idx = text.lower().find(query.lower())
                if idx >= 0:
                    start = max(0, idx - 100)
                    snippet = text[start:start + 300]
                else:
                    snippet = text[:300]

                formatted_results.append({
                    'id': str(doc.id),
                    'document_id': str(doc.id),
                    'title': doc.title,
                    'snippet': snippet,
                    'relevance_score': 0.8 if query.lower() in (doc.title or '').lower() else 0.5,
                    'matched_text': snippet,
                })
            logger.info(f"SQL search by {request.user.username}: '{query}' -> {len(formatted_results)} results")

        # Log search access
        for result in formatted_results:
            try:
                document = Document.objects.get(id=result['document_id'])
                DocumentAccessLog.objects.create(
                    document=document,
                    user=request.user,
                    action='search',
                    ip_address=self._get_client_ip(request)
                )
            except Document.DoesNotExist:
                pass

        total = len(formatted_results)
        paginated = formatted_results[offset:offset + limit]

        return Response({
            'count': total,
            'results': paginated,
            'next': None,
            'previous': None,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def search(self, request):
        """
        Perform semantic search across company documents (legacy POST endpoint)
        """
        query = request.data.get('query', '').strip()
        limit = request.data.get('limit', 20)
        threshold = request.data.get('threshold', 0.5)
        
        if not query:
            return Response(
                {'error': 'Query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(query) < 3:
            return Response(
                {'error': 'Query must be at least 3 characters'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from utils.vector_db import VectorDB
            
            vector_db = VectorDB()
            results = vector_db.search(query, top_k=limit, threshold=threshold)
            
            # Log search access
            from apps.documents.models import Document
            for result in results:
                try:
                    document = Document.objects.get(vector_db_id=result['id'])
                    DocumentAccessLog.objects.create(
                        document=document,
                        user=request.user,
                        action='search',
                        ip_address=self._get_client_ip(request)
                    )
                except Document.DoesNotExist:
                    pass
            
            logger.info(f"Semantic search performed by {request.user.username}: {query}")
            
            return Response({
                'query': query,
                'result_count': len(results),
                'results': results
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error performing semantic search: {str(e)}")
            return Response(
                {'error': f"Search failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def verify_index(self, request):
        """
        Verify vector database indexes (admin only)
        """
        if request.user.role != 'admin':
            return Response(
                {'error': 'Only administrators can verify indexes'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            from utils.vector_db import VectorDB
            
            vector_db = VectorDB()
            stats = vector_db.get_collection_stats()
            
            logger.info(f"Vector DB verification by {request.user.username}")
            
            return Response({
                'collection_name': stats.get('collection_name'),
                'total_documents': stats.get('total_documents', 0),
                'total_chunks': stats.get('total_chunks', 0),
                'status': 'healthy'
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            logger.error(f"Error verifying index: {str(e)}")
            return Response(
                {'error': str(e), 'status': 'unhealthy'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
