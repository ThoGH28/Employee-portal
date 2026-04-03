from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from apps.assets.models import CompanyAsset, AssetAssignment
from apps.assets.serializers import CompanyAssetSerializer, AssetAssignmentSerializer
import logging

logger = logging.getLogger(__name__)


class CompanyAssetViewSet(viewsets.ModelViewSet):
    queryset = CompanyAsset.objects.all()
    serializer_class = CompanyAssetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['asset_type', 'status', 'condition']
    search_fields = ['name', 'asset_code', 'serial_number', 'brand', 'model']
    ordering_fields = ['name', 'purchase_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return CompanyAsset.objects.all()
        # Employees can only see assets assigned to them (via assignments)
        return CompanyAsset.objects.filter(assignments__employee=user, assignments__is_active=True).distinct()

    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        user = request.user
        if user.role not in ['admin', 'hr']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        asset = self.get_object()
        if asset.status == 'assigned':
            return Response({'detail': 'Tài sản đã được bàn giao cho người khác.'}, status=status.HTTP_400_BAD_REQUEST)

        employee_id = request.data.get('employee')
        assigned_date = request.data.get('assigned_date')
        expected_return_date = request.data.get('expected_return_date')
        notes = request.data.get('notes', '')

        if not employee_id or not assigned_date:
            return Response({'detail': 'employee và assigned_date là bắt buộc.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.users.models import CustomUser
        try:
            employee = CustomUser.objects.get(id=employee_id)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'Nhân viên không tồn tại.'}, status=status.HTTP_404_NOT_FOUND)

        assignment = AssetAssignment.objects.create(
            asset=asset, employee=employee,
            assigned_by=user,
            assigned_date=assigned_date,
            expected_return_date=expected_return_date,
            condition_on_assign=asset.condition,
            notes=notes,
        )
        asset.status = 'assigned'
        asset.save()
        return Response(AssetAssignmentSerializer(assignment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='return')
    def return_asset(self, request, pk=None):
        user = request.user
        if user.role not in ['admin', 'hr']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        asset = self.get_object()
        assignment = AssetAssignment.objects.filter(asset=asset, is_active=True).first()
        if not assignment:
            return Response({'detail': 'Tài sản chưa được bàn giao.'}, status=status.HTTP_400_BAD_REQUEST)
        assignment.return_date = timezone.localdate()
        assignment.condition_on_return = request.data.get('condition_on_return', 'good')
        assignment.notes = request.data.get('notes', assignment.notes)
        assignment.is_active = False
        assignment.save()
        asset.status = 'available'
        asset.condition = assignment.condition_on_return
        asset.save()
        return Response(AssetAssignmentSerializer(assignment).data)


class AssetAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AssetAssignment.objects.select_related('asset', 'employee', 'assigned_by')
    serializer_class = AssetAssignmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_active', 'employee', 'asset']
    ordering_fields = ['assigned_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return AssetAssignment.objects.select_related('asset', 'employee', 'assigned_by').all()
        return AssetAssignment.objects.filter(employee=user)
