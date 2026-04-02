"""
Views for AI chatbot
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes as perm_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from apps.chat.models import ChatSession, ChatMessage, ChatFeedback
from apps.chat.serializers import (
    ChatSessionSerializer,
    ChatMessageSerializer,
    ChatMessageCreateSerializer,
    ChatFeedbackSerializer,
    ChatFeedbackCreateSerializer
)
from apps.chat.employee_lookup import EmployeeLookupService

logger = logging.getLogger(__name__)


class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for chat sessions
    """
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get sessions for current user only"""
        return ChatSession.objects.filter(user=self.request.user).order_by('-updated_at')
    
    def perform_create(self, serializer):
        """Create session for current user"""
        serializer.save(user=self.request.user)
        logger.info(f"Chat session created for {self.request.user.username}")
    
    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Send a message in a session and get AI response
        
        Request body:
        {
            "content": "Your question here"
        }
        """
        session = self.get_object()
        
        if session.user != request.user:
            return Response(
                {'detail': 'You can only message your own sessions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = ChatMessageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Save user message
            user_message = ChatMessage.objects.create(
                session=session,
                role='user',
                content=serializer.validated_data['content']
            )
            
            # Get chat history
            history = []
            for msg in session.messages.exclude(id=user_message.id):
                history.append({
                    'role': msg.role,
                    'content': msg.content
                })
            
            # Get AI response
            from apps.chat.chain import get_chat_response
            from utils.vector_db import VectorDB
            
            vector_db = VectorDB()
            retriever = vector_db.get_retriever()
            
            response_data = get_chat_response(
                user_message.content,
                history,
                retriever
            )
            
            if response_data['success']:
                # Save assistant message
                assistant_message = ChatMessage.objects.create(
                    session=session,
                    role='assistant',
                    content=response_data['answer'],
                    sources=response_data['sources']
                )
                
                # Update session title if empty
                if not session.title:
                    session.title = user_message.content[:50]
                    session.save()
                
                return Response({
                    'user_message': ChatMessageSerializer(user_message).data,
                    'assistant_message': ChatMessageSerializer(assistant_message).data,
                    'sources': response_data['sources']
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'error': response_data['answer']},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        except Exception as e:
            logger.error(f"Error in chat: {str(e)}")
            return Response(
                {'error': f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get full message history for a session"""
        session = self.get_object()
        
        if session.user != request.user:
            return Response(
                {'detail': 'You can only access your own sessions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        messages = session.messages.all()
        serializer = ChatMessageSerializer(messages, many=True)
        
        return Response({
            'session_id': str(session.id),
            'title': session.title,
            'messages': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close a chat session"""
        session = self.get_object()
        
        if session.user != request.user:
            return Response(
                {'detail': 'You can only close your own sessions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        session.is_active = False
        session.save()
        logger.info(f"Chat session {session.id} closed by {request.user.username}")
        
        return Response({'message': 'Session closed successfully'})


class ChatFeedbackViewSet(viewsets.ModelViewSet):
    """
    API endpoint for chat feedback
    """
    serializer_class = ChatFeedbackSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get feedback for messages in user's sessions"""
        return ChatFeedback.objects.filter(
            message__session__user=self.request.user
        )
    
    def create(self, request, *args, **kwargs):
        """Create feedback for a chat message"""
        serializer = ChatFeedbackCreateSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message = ChatMessage.objects.get(id=serializer.validated_data['message_id'])
            
            # Check ownership
            if message.session.user != request.user:
                return Response(
                    {'detail': 'You can only provide feedback on your own messages'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create feedback
            feedback = ChatFeedback.objects.create(
                message=message,
                rating=serializer.validated_data['rating'],
                comment=serializer.validated_data.get('comment', '')
            )
            
            logger.info(f"Chat feedback created by {request.user.username}")
            
            return Response(
                ChatFeedbackSerializer(feedback).data,
                status=status.HTTP_201_CREATED
            )
        
        except ChatMessage.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error creating feedback: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# ═══════════════════════════════════════════════════════════
# Employee Lookup API (for chatbot function-calling)
# ═══════════════════════════════════════════════════════════

class EmployeeLookupViewSet(viewsets.ViewSet):
    """
    API endpoints for chatbot employee lookup.
    All results respect sensitive-field policy.
    """
    permission_classes = [IsAuthenticated]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.svc = EmployeeLookupService()

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        """
        GET /api/chat/employee-lookup/search/?q=<query>
        Search employees by name / employee_id / email / phone.
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response(
                {'detail': 'Query parameter "q" is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = self.svc.search_employee(q)
        return Response(result)

    @action(detail=False, methods=['get'], url_path='department')
    def by_department(self, request):
        """
        GET /api/chat/employee-lookup/department/?dept=it
        """
        dept = request.query_params.get('dept', '').strip()
        if not dept:
            return Response(
                {'detail': 'Query parameter "dept" is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = self.svc.list_by_department(dept)
        return Response(result)

    @action(detail=False, methods=['get'], url_path='department-summary')
    def department_summary(self, request):
        """
        GET /api/chat/employee-lookup/department-summary/
        """
        return Response(self.svc.department_summary())

    @action(detail=False, methods=['get'], url_path='manager')
    def manager_of(self, request):
        """
        GET /api/chat/employee-lookup/manager/?q=<name>
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'detail': '"q" is required.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.svc.get_manager_of(q))

    @action(detail=False, methods=['get'], url_path='direct-reports')
    def direct_reports(self, request):
        """
        GET /api/chat/employee-lookup/direct-reports/?q=<manager>
        """
        q = request.query_params.get('q', '').strip()
        if not q:
            return Response({'detail': '"q" is required.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.svc.get_direct_reports(q))
