from rest_framework import serializers
from apps.assets.models import CompanyAsset, AssetAssignment


class CompanyAssetSerializer(serializers.ModelSerializer):
    asset_type_display = serializers.CharField(source='get_asset_type_display', read_only=True)
    condition_display = serializers.CharField(source='get_condition_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_assignee = serializers.SerializerMethodField()

    class Meta:
        model = CompanyAsset
        fields = [
            'id', 'name', 'asset_code', 'asset_type', 'asset_type_display',
            'brand', 'model', 'serial_number',
            'purchase_date', 'purchase_price',
            'condition', 'condition_display', 'status', 'status_display',
            'current_assignee', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_current_assignee(self, obj):
        active = obj.assignments.filter(is_active=True).select_related('employee').first()
        if active:
            return {'id': str(active.employee.id), 'name': active.employee.get_full_name()}
        return None


class AssetAssignmentSerializer(serializers.ModelSerializer):
    asset_name = serializers.CharField(source='asset.name', read_only=True)
    asset_code = serializers.CharField(source='asset.asset_code', read_only=True)
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True, default='')

    class Meta:
        model = AssetAssignment
        fields = [
            'id', 'asset', 'asset_name', 'asset_code',
            'employee', 'employee_name',
            'assigned_by', 'assigned_by_name',
            'assigned_date', 'expected_return_date', 'return_date',
            'condition_on_assign', 'condition_on_return',
            'notes', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_active', 'created_at', 'updated_at']
