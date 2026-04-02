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
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """
        Perform semantic search across company documents
        
        Request body:
        {
            "query": "search query",
            "limit": 20,
            "threshold": 0.5
        }
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
