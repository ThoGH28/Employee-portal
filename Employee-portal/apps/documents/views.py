"""
Views for document management
"""
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from celery import current_app
import logging

from apps.documents.models import Document, DocumentChunk, DocumentMetadata, DocumentAccessLog
from apps.documents.serializers import (
    DocumentSerializer,
    DocumentUploadSerializer,
    DocumentSearchSerializer,
    DocumentChunkSerializer,
    DocumentMetadataSerializer
)

logger = logging.getLogger(__name__)


class DocumentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for document management
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['document_type', 'status', 'is_indexed']
    search_fields = ['title', 'description', 'extracted_text']
    ordering_fields = ['created_at', 'title']
    ordering = ['-created_at']
    parser_classes = (MultiPartParser, FormParser)
    
    def get_serializer_class(self):
        """Use different serializer for upload"""
        if self.action == 'create':
            return DocumentUploadSerializer
        return DocumentSerializer
    
    def get_queryset(self):
        """Filter documents based on user permissions with department scope"""
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return Document.objects.all()
        # Regular users see their department docs + company-wide docs
        dept = user.get_department()
        if dept:
            return Document.objects.filter(
                models.Q(department=dept) | models.Q(department='company')
            )
        return Document.objects.filter(department='company')
    
    def create(self, request, *args, **kwargs):
        """Upload and process document"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        
        # Log access
        self._log_access(document, 'upload', request)
        
        # Trigger document processing task (Celery)
        try:
            from utils.document_processor import process_document_task
            process_document_task.delay(str(document.id))
            logger.info(f"Document processing task queued for {document.id}")
        except Exception as e:
            logger.error(f"Error queuing document processing: {str(e)}")
            document.status = 'failed'
            document.save()
        
        return Response(
            DocumentSerializer(document).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def reindex(self, request, pk=None):
        """Reindex document to vector database"""
        document = self.get_object()
        
        try:
            from utils.document_processor import process_document_task
            process_document_task.delay(str(document.id))
            logger.info(f"Document reindexing task queued for {document.id}")
            
            return Response(
                {'message': 'Document reindexing started'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error queuing reindex task: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def chunks(self, request, pk=None):
        """Get document chunks"""
        document = self.get_object()
        chunks = document.chunks.all()
        serializer = DocumentChunkSerializer(chunks, many=True)
        
        self._log_access(document, 'view', request)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def metadata(self, request, pk=None):
        """Get document metadata"""
        document = self.get_object()
        
        if not hasattr(document, 'metadata'):
            return Response(
                {'error': 'No metadata available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = DocumentMetadataSerializer(document.metadata)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def access_logs(self, request, pk=None):
        """Get document access logs (admin only)"""
        if request.user.role != 'admin':
            return Response(
                {'detail': 'You do not have permission to view access logs'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        document = self.get_object()
        logs = document.access_logs.all()
        
        return Response({
            'document_id': str(document.id),
            'title': document.title,
            'total_accesses': logs.count(),
            'logs': [
                {
                    'user': log.user.username if log.user else 'Anonymous',
                    'action': log.action,
                    'accessed_at': log.accessed_at
                }
                for log in logs
            ]
        })
    
    def _log_access(self, document, action, request):
        """Log document access"""
        try:
            DocumentAccessLog.objects.create(
                document=document,
                user=request.user if request.user.is_authenticated else None,
                action=action,
                ip_address=self._get_client_ip(request)
            )
        except Exception as e:
            logger.error(f"Error logging document access: {str(e)}")
    
    @staticmethod
    def _get_client_ip(request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class DocumentSearchViewSet(viewsets.ViewSet):
    """
    API endpoint for document search
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def search(self, request):
        """
        Search documents using semantic search
        
        Request body:
        {
            "query": "search query string",
            "limit": 10,
            "threshold": 0.5
        }
        """
        query = request.data.get('query')
        limit = request.data.get('limit', 10)
        threshold = request.data.get('threshold', 0.5)
        
        if not query:
            return Response(
                {'error': 'Query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from utils.vector_db import VectorDB
            
            vector_db = VectorDB()
            results = vector_db.search(query, top_k=limit, threshold=threshold)
            
            # Log search access
            for result in results:
                document = Document.objects.get(vector_db_id=result['id'])
                DocumentAccessLog.objects.create(
                    document=document,
                    user=request.user,
                    action='search',
                    ip_address=self._get_client_ip(request)
                )
            
            return Response({
                'query': query,
                'results': results
            })
        
        except Exception as e:
            logger.error(f"Error performing semantic search: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
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
