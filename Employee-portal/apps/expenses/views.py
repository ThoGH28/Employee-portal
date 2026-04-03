from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from apps.expenses.models import ExpenseReport, ExpenseItem
from apps.expenses.serializers import (
    ExpenseReportSerializer, ExpenseItemSerializer, ExpenseApprovalSerializer
)
import logging

logger = logging.getLogger(__name__)


class ExpenseReportViewSet(viewsets.ModelViewSet):
    queryset = ExpenseReport.objects.select_related('employee', 'approved_by').prefetch_related('items')
    serializer_class = ExpenseReportSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'total_amount']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return ExpenseReport.objects.select_related('employee', 'approved_by').prefetch_related('items').all()
        return ExpenseReport.objects.filter(employee=user).prefetch_related('items')

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=True, methods=['post'], url_path='submit')
    def submit(self, request, pk=None):
        report = self.get_object()
        if report.employee != request.user:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        if report.status != 'draft':
            return Response({'detail': 'Chỉ có thể gửi đơn ở trạng thái nháp.'}, status=status.HTTP_400_BAD_REQUEST)
        if not report.items.exists():
            return Response({'detail': 'Đơn phải có ít nhất một khoản chi.'}, status=status.HTTP_400_BAD_REQUEST)
        report.recalculate_total()
        report.status = 'submitted'
        report.save()
        return Response(ExpenseReportSerializer(report).data)

    @action(detail=True, methods=['post'], url_path='process')
    def process(self, request, pk=None):
        user = request.user
        if user.role not in ['admin', 'hr']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        report = self.get_object()
        serializer = ExpenseApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data['status']
        if report.status not in ['submitted', 'approved']:
            return Response({'detail': 'Không thể xử lý đơn ở trạng thái này.'}, status=status.HTTP_400_BAD_REQUEST)
        report.status = new_status
        report.approved_by = user
        report.approval_comment = serializer.validated_data.get('approval_comment', '')
        report.approved_at = timezone.now()
        if new_status == 'paid':
            report.payment_date = serializer.validated_data.get('payment_date', timezone.localdate())
        report.save()
        return Response(ExpenseReportSerializer(report).data)


class ExpenseItemViewSet(viewsets.ModelViewSet):
    queryset = ExpenseItem.objects.select_related('report')
    serializer_class = ExpenseItemSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['report', 'category']
    ordering_fields = ['expense_date', 'amount']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return ExpenseItem.objects.select_related('report').all()
        return ExpenseItem.objects.filter(report__employee=user)

    def perform_create(self, serializer):
        report = serializer.validated_data['report']
        if report.employee != self.request.user and self.request.user.role not in ['admin', 'hr']:
            from rest_framework import exceptions
            raise exceptions.PermissionDenied('Không có quyền thêm khoản chi vào đơn này.')
        if report.status != 'draft':
            from rest_framework import exceptions
            raise exceptions.ValidationError('Chỉ có thể thêm khoản chi vào đơn nháp.')
        serializer.save()
        report.recalculate_total()
