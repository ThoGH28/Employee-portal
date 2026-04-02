"""
Employee models for profile and leave management
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import CustomUser
import uuid


class EmployeeProfile(models.Model):
    """
    Extended employee profile information
    """
    DEPARTMENT_CHOICES = (
        ('hr', 'Nhân sự'),
        ('it', 'Công nghệ Thông tin'),
        ('sales', 'Kinh doanh'),
        ('marketing', 'Marketing'),
        ('operations', 'Vận hành'),
        ('finance', 'Tài chính'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profile')
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES)
    designation = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=50, unique=True)
    date_of_joining = models.DateField()
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    emergency_contact = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='direct_reports'
    )
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)
    bio = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['user__first_name']
        indexes = [
            models.Index(fields=['employee_id']),
            models.Index(fields=['department']),
        ]
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.designation}"


class LeaveRequest(models.Model):
    """
    Employee leave request management
    """
    STATUS_CHOICES = (
        ('pending', 'Chờ duyệt'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
        ('cancelled', 'Đã hủy'),
    )
    
    LEAVE_TYPE_CHOICES = (
        ('sick', 'Nghỉ ốm'),
        ('casual', 'Nghỉ việc riêng'),
        ('earned', 'Nghỉ phép năm'),
        ('maternity', 'Nghỉ thai sản'),
        ('paternity', 'Nghỉ chăm con'),
        ('unpaid', 'Nghỉ không lương'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=50, choices=LEAVE_TYPE_CHOICES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_leaves'
    )
    approval_date = models.DateTimeField(blank=True, null=True)
    approval_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['start_date', 'end_date']),
        ]
    
    def __str__(self):
        return f"{self.employee.username} - {self.leave_type} ({self.status})"


class HRAnnouncement(models.Model):
    """
    HR announcements for employees
    """
    STATUS_CHOICES = (
        ('draft', 'Nháp'),
        ('published', 'Đã xuất bản'),
        ('archived', 'Lưu trữ'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    content = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    target_department = models.CharField(
        max_length=50,
        choices=EmployeeProfile.DEPARTMENT_CHOICES + (('all', 'Tất cả'),),
        default='all',
        help_text="Target department for this announcement, or 'all' for company-wide"
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_announcements'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)
    expires_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'published_at']),
        ]
    
    def __str__(self):
        return self.title


class Payslip(models.Model):
    """
    Employee payslip/salary statement
    """
    STATUS_CHOICES = (
        ('draft', 'Nháp'),
        ('finalized', 'Đã hoàn tất'),
        ('distributed', 'Đã phát'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='payslips')
    month_year = models.DateField(help_text="Ngày đầu tiên của tháng cho phiếu lương")
    
    # Earnings
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    house_rent_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    dearness_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Deductions
    provident_fund = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    tax_deducted_at_source = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    insurance = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    # Calculated fields
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Metadata
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    pdf_file = models.FileField(upload_to='payslips/', blank=True, null=True)
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_payslips'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-month_year']
        unique_together = ['employee', 'month_year']
        indexes = [
            models.Index(fields=['employee', 'month_year']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate totals before saving
        self.gross_salary = (
            self.basic_salary +
            self.house_rent_allowance +
            self.dearness_allowance +
            self.other_allowances
        )
        self.total_deductions = (
            self.provident_fund +
            self.tax_deducted_at_source +
            self.insurance +
            self.other_deductions
        )
        self.net_salary = self.gross_salary - self.total_deductions
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.username} - Payslip ({self.month_year.strftime('%B %Y')})"


class AdministrativeRequest(models.Model):
    """
    Administrative requests (employment verification, card replacement, etc.)
    """
    REQUEST_TYPE_CHOICES = (
        ('employment_verification', 'Xác nhận công tác'),
        ('card_replacement', 'Cấp lại thẻ'),
        ('salary_certificate', 'Giấy xác nhận lương'),
        ('experience_letter', 'Giấy xác nhận kinh nghiệm'),
        ('other', 'Khác'),
    )

    STATUS_CHOICES = (
        ('pending', 'Chờ duyệt'),
        ('in_progress', 'Đang xử lý'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
        ('completed', 'Hoàn thành'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Thấp'),
        ('medium', 'Trung bình'),
        ('high', 'Cao'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='admin_requests')
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    processed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_requests'
    )
    admin_comment = models.TextField(blank=True)
    attachment = models.FileField(upload_to='admin_requests/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['request_type', 'status']),
        ]

    def __str__(self):
        return f"{self.employee.username} - {self.get_request_type_display()} ({self.status})"
