from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from apps.surveys.models import Survey, SurveyQuestion, SurveyResponse
from apps.surveys.serializers import (
    SurveySerializer, SurveyQuestionSerializer, SurveyResponseSerializer
)
import logging

logger = logging.getLogger(__name__)


class SurveyViewSet(viewsets.ModelViewSet):
    queryset = Survey.objects.prefetch_related('questions')
    serializer_class = SurveySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'target_department']
    search_fields = ['title', 'description']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        dept = user.get_department()
        if user.role in ['admin', 'hr']:
            return Survey.objects.prefetch_related('questions').all()
        return Survey.objects.prefetch_related('questions').filter(
            target_department__in=[dept, 'all'],
            status='active',
        )

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'hr']:
            from rest_framework import exceptions
            raise exceptions.PermissionDenied('Chỉ Admin/HR mới có thể tạo khảo sát.')
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit_response(self, request, pk=None):
        survey = self.get_object()
        today = timezone.localdate()
        if survey.status != 'active':
            return Response({'detail': 'Khảo sát không đang mở.'}, status=status.HTTP_400_BAD_REQUEST)
        if today < survey.start_date or today > survey.end_date:
            return Response({'detail': 'Ngoài thời gian khảo sát.'}, status=status.HTTP_400_BAD_REQUEST)
        if not survey.is_anonymous:
            if SurveyResponse.objects.filter(survey=survey, respondent=request.user).exists():
                return Response({'detail': 'Bạn đã tham gia khảo sát này rồi.'}, status=status.HTTP_400_BAD_REQUEST)

        respondent = None if survey.is_anonymous else request.user
        data = dict(request.data)
        data['survey'] = str(survey.id)
        data['respondent'] = str(respondent.id) if respondent else None
        serializer = SurveyResponseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(survey=survey, respondent=respondent)
        return Response(SurveyResponseSerializer(instance).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='results')
    def results(self, request, pk=None):
        survey = self.get_object()
        if request.user.role not in ['admin', 'hr']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        responses = SurveyResponse.objects.filter(survey=survey).prefetch_related('answers__question')
        return Response(SurveyResponseSerializer(responses, many=True).data)


class SurveyQuestionViewSet(viewsets.ModelViewSet):
    queryset = SurveyQuestion.objects.select_related('survey')
    serializer_class = SurveyQuestionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['survey']
    ordering_fields = ['order']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from apps.users.permissions import IsAdminOrHR
            return [IsAdminOrHR()]
        return [IsAuthenticated()]
