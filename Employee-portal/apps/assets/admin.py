from django.contrib import admin
from apps.assets.models import CompanyAsset, AssetAssignment

@admin.register(CompanyAsset)
class CompanyAssetAdmin(admin.ModelAdmin):
    list_display = ['asset_code', 'name', 'asset_type', 'status', 'condition', 'purchase_date']
    list_filter = ['asset_type', 'status', 'condition']
    search_fields = ['name', 'asset_code', 'serial_number']

@admin.register(AssetAssignment)
class AssetAssignmentAdmin(admin.ModelAdmin):
    list_display = ['asset', 'employee', 'assigned_date', 'return_date', 'is_active']
    list_filter = ['is_active']
    search_fields = ['asset__asset_code', 'employee__username']
