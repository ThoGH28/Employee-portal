"""
Views for automation tasks
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
import logging

from apps.automation.models import AutomationTask, DocumentSummary, GeneratedAnnouncement
from apps.automation.serializers import (
    AutomationTaskSerializer,
    DocumentSummarySerializer,
    GeneratedAnnouncementSerializer,
    SummarizeDocumentSerializer,
    GenerateAnnouncementSerializer,
    ApproveAnnouncementSerializer
)
from apps.automation.agents import (
    DocumentSummarizationAgent,
    AnnouncementGenerationAgent,
    InsightExtractionAgent
)
from apps.documents.models import Document

logger = logging.getLogger(__name__)


class AutomationTaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for automation tasks
    """
    serializer_class = AutomationTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get tasks for current user"""
        user = self.request.user
        if user.role == 'admin':
            return AutomationTask.objects.all()
        return AutomationTask.objects.filter(created_by=user)
    
    def perform_create(self, serializer):
        """Create task for current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def summarize_document(self, request):
        """
        Summarize a document using AI
        
        Request body:
        {
            "document_id": "uuid",
            "length": "medium"  # short, medium, long
        }
        """
        serializer = SummarizeDocumentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = Document.objects.get(id=serializer.validated_data['document_id'])
            
            # Check if document is indexed
            if not document.is_indexed:
                return Response(
                    {'error': 'Document must be indexed before summarization'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create task record
            task = AutomationTask.objects.create(
                task_type='summarize',
                status='running',
                created_by=request.user,
                document=document,
                input_data={'length': serializer.validated_data['length']},
                started_at=timezone.now()
            )
            
            # Perform summarization
            agent = DocumentSummarizationAgent()
            result = agent.summarize(
                document.extracted_text,
                serializer.validated_data['length']
            )
            
            if result['success']:
                # Save summary
                summary = DocumentSummary.objects.update_or_create(
                    document=document,
                    defaults={
                        'summary': result['summary'],
                        'length_type': serializer.validated_data['length'],
                        'key_points': result['key_points'],
                        'generated_by': request.user
                    }
                )[0]
                
                task.status = 'completed'
                task.output_data = {
                    'summary_id': str(summary.id),
                    'summary': result['summary'],
                    'key_points': result['key_points']
                }
                task.completed_at = timezone.now()
            else:
                task.status = 'failed'
                task.error_message = result.get('error', 'Unknown error')
            
            task.save()
            logger.info(f"Document summarization task completed for {document.id}")
            
            return Response(AutomationTaskSerializer(task).data, status=status.HTTP_200_OK)
        
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in summarization: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_announcement(self, request):
        """
        Generate HR announcement from document
        
        Request body:
        {
            "document_id": "uuid"
        }
        """
        serializer = GenerateAnnouncementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            document = Document.objects.get(id=serializer.validated_data['document_id'])
            
            # Check if document is indexed
            if not document.is_indexed:
                return Response(
                    {'error': 'Document must be indexed before announcement generation'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create task record
            task = AutomationTask.objects.create(
                task_type='generate_announcement',
                status='running',
                created_by=request.user,
                document=document,
                started_at=timezone.now()
            )
            
            # Generate announcement
            agent = AnnouncementGenerationAgent()
            result = agent.generate_announcement(
                document.extracted_text,
                document.title
            )
            
            if result['success']:
                # Save announcement
                announcement = GeneratedAnnouncement.objects.create(
                    source_document=document,
                    title=result['title'],
                    content=result['content'],
                    generated_by=request.user
                )
                
                task.status = 'completed'
                task.output_data = {
                    'announcement_id': str(announcement.id),
                    'title': result['title'],
                    'content': result['content']
                }
                task.completed_at = timezone.now()
            else:
                task.status = 'failed'
                task.error_message = result.get('error', 'Unknown error')
            
            task.save()
            logger.info(f"Announcement generation task completed for {document.id}")
            
            return Response(AutomationTaskSerializer(task).data, status=status.HTTP_200_OK)
        
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in announcement generation: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DocumentSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing document summaries
    """
    serializer_class = DocumentSummarySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get summaries"""
        return DocumentSummary.objects.all()


class GeneratedAnnouncementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for generated announcements
    """
    serializer_class = GeneratedAnnouncementSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get announcements"""
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return GeneratedAnnouncement.objects.all()
        return GeneratedAnnouncement.objects.filter(is_published=True)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve and publish announcement (HR/Admin only)
        """
        if request.user.role not in ['admin', 'hr']:
            return Response(
                {'error': 'Only HR and admins can approve announcements'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        announcement = self.get_object()
        serializer = ApproveAnnouncementSerializer(data=request.data)
        
        if serializer.is_valid():
            if serializer.validated_data['is_approved']:
                announcement.is_published = True
                announcement.approved_by = request.user
                announcement.approved_at = timezone.now()
                logger.info(f"Announcement {announcement.id} approved by {request.user.username}")
            else:
                announcement.is_published = False
                logger.info(f"Announcement {announcement.id} rejected by {request.user.username}")
            
            announcement.save()
            return Response(GeneratedAnnouncementSerializer(announcement).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
