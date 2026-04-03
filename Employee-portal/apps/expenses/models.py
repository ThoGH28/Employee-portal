"""
Expense reimbursement models
"""
from django.db import models
from django.core.validators import MinValueValidator
from apps.users.models import CustomUser
import uuid


class ExpenseReport(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Nháp'),
        ('submitted', 'Đã gửi'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
        ('paid', 'Đã thanh toán'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='expense_reports')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    approved_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_expenses'
    )
    approval_comment = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    payment_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
        ]

    def recalculate_total(self):
        self.total_amount = sum(item.amount for item in self.items.all())
        self.save(update_fields=['total_amount', 'updated_at'])

    def __str__(self):
        return f"{self.employee.username} - {self.title}"


class ExpenseItem(models.Model):
    CATEGORY_CHOICES = (
        ('travel', 'Đi lại / Di chuyển'),
        ('accommodation', 'Lưu trú'),
        ('meal', 'Ăn uống'),
        ('communication', 'Điện thoại / Internet'),
        ('office_supply', 'Văn phòng phẩm'),
        ('entertainment', 'Tiếp khách'),
        ('other', 'Khác'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(ExpenseReport, on_delete=models.CASCADE, related_name='items')
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    expense_date = models.DateField()
    receipt_file = models.FileField(upload_to='expense_receipts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['expense_date']

    def __str__(self):
        return f"{self.report.title} - {self.get_category_display()} ({self.amount})"
