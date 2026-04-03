from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from django.utils import timezone

from apps.attendance.models import AttendanceRecord, OvertimeRequest
from apps.attendance.serializers import (
    AttendanceRecordSerializer, AttendanceRecordCreateSerializer,
    OvertimeRequestSerializer, OvertimeApprovalSerializer,
)
from apps.users.permissions import IsAdminOrHR, IsDeptManagerOrAbove
import logging

logger = logging.getLogger(__name__)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('employee', 'employee__profile')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'date', 'employee']
    ordering_fields = ['date', 'clock_in']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AttendanceRecordCreateSerializer
        return AttendanceRecordSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return AttendanceRecord.objects.select_related('employee', 'employee__profile').all()
        if user.is_department_manager():
            dept = user.get_department()
            return AttendanceRecord.objects.select_related('employee', 'employee__profile').filter(
                employee__profile__department=dept
            )
        return AttendanceRecord.objects.filter(employee=user)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=False, methods=['post'], url_path='clock-in')
    def clock_in(self, request):
        today = timezone.localdate()
        record, created = AttendanceRecord.objects.get_or_create(
            employee=request.user, date=today,
            defaults={'clock_in': timezone.localtime().time(), 'status': 'present'}
        )
        if not created:
            if record.clock_in:
                return Response({'detail': 'Bạn đã chấm công vào hôm nay.'}, status=status.HTTP_400_BAD_REQUEST)
            record.clock_in = timezone.localtime().time()
            record.status = 'present'
            record.save()
        return Response(AttendanceRecordSerializer(record).data)

    @action(detail=False, methods=['post'], url_path='clock-out')
    def clock_out(self, request):
        today = timezone.localdate()
        try:
            record = AttendanceRecord.objects.get(employee=request.user, date=today)
        except AttendanceRecord.DoesNotExist:
            return Response({'detail': 'Chưa chấm công vào hôm nay.'}, status=status.HTTP_400_BAD_REQUEST)
        if record.clock_out:
            return Response({'detail': 'Bạn đã chấm công ra hôm nay.'}, status=status.HTTP_400_BAD_REQUEST)
        record.clock_out = timezone.localtime().time()
        record.save()
        return Response(AttendanceRecordSerializer(record).data)

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        today = timezone.localdate()
        try:
            record = AttendanceRecord.objects.get(employee=request.user, date=today)
            return Response(AttendanceRecordSerializer(record).data)
        except AttendanceRecord.DoesNotExist:
            return Response({'detail': 'Chưa có bản ghi hôm nay.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        """Monthly summary for current user or specified employee"""
        user = request.user
        month = request.query_params.get('month')
        year = request.query_params.get('year')
        emp_id = request.query_params.get('employee')

        from datetime import date
        today = date.today()
        target_month = int(month) if month else today.month
        target_year = int(year) if year else today.year

        qs = AttendanceRecord.objects.filter(date__year=target_year, date__month=target_month)
        if emp_id and user.role in ['admin', 'hr']:
            qs = qs.filter(employee_id=emp_id)
        else:
            qs = qs.filter(employee=user)

        summary = {}
        for s, _ in AttendanceRecord.STATUS_CHOICES:
            summary[s] = qs.filter(status=s).count()
        summary['total_days'] = qs.count()
        summary['total_hours'] = float(sum(r.work_hours for r in qs))
        return Response(summary)


class OvertimeRequestViewSet(viewsets.ModelViewSet):
    queryset = OvertimeRequest.objects.select_related('employee', 'approved_by')
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'date']
    ordering_fields = ['date', 'created_at']
    serializer_class = OvertimeRequestSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return OvertimeRequest.objects.select_related('employee', 'approved_by').all()
        if user.is_department_manager():
            dept = user.get_department()
            return OvertimeRequest.objects.select_related('employee', 'approved_by').filter(
                employee__profile__department=dept
            )
        return OvertimeRequest.objects.filter(employee=user)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        user = request.user
        if not (user.role in ['admin', 'hr'] or user.is_department_manager()):
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        ot = self.get_object()
        if ot.status not in ['pending']:
            return Response({'detail': 'Chỉ có thể duyệt đơn đang chờ.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OvertimeApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ot.status = serializer.validated_data['status']
        ot.approval_comment = serializer.validated_data.get('approval_comment', '')
        ot.approved_by = user
        ot.approved_at = timezone.now()
        ot.save()
        return Response(OvertimeRequestSerializer(ot).data)
