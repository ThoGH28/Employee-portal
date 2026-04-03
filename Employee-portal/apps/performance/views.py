from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.performance.models import KPIGoal, PerformanceReview
from apps.performance.serializers import KPIGoalSerializer, PerformanceReviewSerializer
import logging

logger = logging.getLogger(__name__)


class KPIGoalViewSet(viewsets.ModelViewSet):
    queryset = KPIGoal.objects.select_related('employee', 'created_by')
    serializer_class = KPIGoalSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['year', 'period', 'status', 'employee']
    search_fields = ['title', 'description']
    ordering_fields = ['year', 'period', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return KPIGoal.objects.select_related('employee', 'created_by').all()
        if user.is_department_manager():
            dept = user.get_department()
            return KPIGoal.objects.select_related('employee', 'created_by').filter(
                employee__profile__department=dept
            )
        return KPIGoal.objects.filter(employee=user)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['admin', 'hr'] and not user.is_department_manager():
            # employees can only create goals for themselves
            serializer.save(employee=user, created_by=user)
        else:
            serializer.save(created_by=user)


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    queryset = PerformanceReview.objects.select_related('employee', 'reviewer')
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['year', 'status', 'employee']
    ordering_fields = ['year', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return PerformanceReview.objects.select_related('employee', 'reviewer').all()
        if user.is_department_manager():
            dept = user.get_department()
            return PerformanceReview.objects.select_related('employee', 'reviewer').filter(
                employee__profile__department=dept
            )
        return PerformanceReview.objects.filter(employee=user)

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    @action(detail=True, methods=['post'], url_path='acknowledge')
    def acknowledge(self, request, pk=None):
        review = self.get_object()
        if review.employee != request.user:
            return Response({'detail': 'Chỉ nhân viên được đánh giá mới có thể xác nhận.'}, status=status.HTTP_403_FORBIDDEN)
        if review.status != 'submitted':
            return Response({'detail': 'Đánh giá chưa được gửi.'}, status=status.HTTP_400_BAD_REQUEST)
        employee_comments = request.data.get('employee_comments', '')
        review.employee_comments = employee_comments
        review.status = 'acknowledged'
        review.save()
        return Response(PerformanceReviewSerializer(review).data)
