from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from apps.training.models import TrainingProgram, TrainingEnrollment, Certificate
from apps.training.serializers import (
    TrainingProgramSerializer, TrainingEnrollmentSerializer, CertificateSerializer
)
import logging

logger = logging.getLogger(__name__)


class TrainingProgramViewSet(viewsets.ModelViewSet):
    queryset = TrainingProgram.objects.all()
    serializer_class = TrainingProgramSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'target_department']
    search_fields = ['title', 'description', 'instructor']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        dept = user.get_department()
        if user.role in ['admin', 'hr']:
            return TrainingProgram.objects.all()
        return TrainingProgram.objects.filter(
            target_department__in=[dept, 'all']
        )

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='enroll')
    def enroll(self, request, pk=None):
        program = self.get_object()
        if program.status not in ['upcoming', 'ongoing']:
            return Response({'detail': 'Chương trình không còn mở đăng ký.'}, status=status.HTTP_400_BAD_REQUEST)
        enrolled_count = program.enrollments.filter(status='enrolled').count()
        if enrolled_count >= program.max_participants:
            return Response({'detail': 'Chương trình đã đủ số lượng.'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment, created = TrainingEnrollment.objects.get_or_create(
            employee=request.user, program=program,
            defaults={'status': 'enrolled'}
        )
        if not created:
            return Response({'detail': 'Bạn đã đăng ký chương trình này rồi.'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TrainingEnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='unenroll')
    def unenroll(self, request, pk=None):
        program = self.get_object()
        try:
            enrollment = TrainingEnrollment.objects.get(employee=request.user, program=program)
        except TrainingEnrollment.DoesNotExist:
            return Response({'detail': 'Bạn chưa đăng ký.'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment.status = 'cancelled'
        enrollment.save()
        return Response({'detail': 'Đã hủy đăng ký.'})


class TrainingEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingEnrollment.objects.select_related('employee', 'program')
    serializer_class = TrainingEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'program', 'employee']
    ordering_fields = ['enrolled_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return TrainingEnrollment.objects.select_related('employee', 'program').all()
        return TrainingEnrollment.objects.filter(employee=user)


class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.select_related('employee')
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['title', 'issuer']
    ordering_fields = ['issue_date', 'expiry_date']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return Certificate.objects.select_related('employee').all()
        return Certificate.objects.filter(employee=user)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)
