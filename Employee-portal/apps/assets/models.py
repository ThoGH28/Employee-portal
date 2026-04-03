"""
Company asset management models
"""
from django.db import models
from apps.users.models import CustomUser
import uuid


class CompanyAsset(models.Model):
    ASSET_TYPE_CHOICES = (
        ('laptop', 'Laptop'),
        ('desktop', 'Máy tính để bàn'),
        ('phone', 'Điện thoại'),
        ('tablet', 'Máy tính bảng'),
        ('monitor', 'Màn hình'),
        ('keyboard', 'Bàn phím / Chuột'),
        ('headset', 'Tai nghe'),
        ('other', 'Khác'),
    )
    CONDITION_CHOICES = (
        ('new', 'Mới'),
        ('good', 'Tốt'),
        ('fair', 'Trung bình'),
        ('poor', 'Kém'),
    )
    STATUS_CHOICES = (
        ('available', 'Sẵn sàng'),
        ('assigned', 'Đã bàn giao'),
        ('maintenance', 'Bảo trì'),
        ('retired', 'Đã thanh lý'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    asset_code = models.CharField(max_length=50, unique=True)
    asset_type = models.CharField(max_length=50, choices=ASSET_TYPE_CHOICES)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(blank=True, null=True)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['asset_type', 'name']
        indexes = [
            models.Index(fields=['asset_type', 'status']),
            models.Index(fields=['asset_code']),
        ]

    def __str__(self):
        return f"{self.asset_code} - {self.name}"


class AssetAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    asset = models.ForeignKey(CompanyAsset, on_delete=models.CASCADE, related_name='assignments')
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='asset_assignments')
    assigned_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='assigned_assets')
    assigned_date = models.DateField()
    expected_return_date = models.DateField(blank=True, null=True)
    return_date = models.DateField(blank=True, null=True)
    condition_on_assign = models.CharField(max_length=20, choices=CompanyAsset.CONDITION_CHOICES, default='good')
    condition_on_return = models.CharField(max_length=20, choices=CompanyAsset.CONDITION_CHOICES, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-assigned_date']
        indexes = [
            models.Index(fields=['employee', 'is_active']),
            models.Index(fields=['asset', 'is_active']),
        ]

    def __str__(self):
        return f"{self.asset.asset_code} → {self.employee.username}"
