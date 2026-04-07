"""
Attendance models: daily time tracking + overtime requests
"""
from django.db import models
from django.core.validators import MinValueValidator
from apps.users.models import CustomUser
import uuid
from datetime import time as dt_time

LATE_THRESHOLD = dt_time(8, 30)          # 08:30 giờ vào muộn
LATE_PENALTY_AMOUNT = 50000              # 50,000 VND phạt mỗi lần muộn không được tha


class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('present', 'Có mặt'),
        ('absent', 'Vắng mặt'),
        ('late', 'Đi muộn'),
        ('wfh', 'Làm việc từ xa'),
        ('half_day', 'Nửa ngày'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    clock_in = models.TimeField(blank=True, null=True)
    clock_out = models.TimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='present')
    work_hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    late_minutes = models.PositiveIntegerField(default=0, help_text="Số phút đi muộn so với 8:30")
    penalty_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="Tiền phạt (0 nếu đúng giờ hoặc đã được tha)"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['employee', 'date']
        indexes = [
            models.Index(fields=['employee', 'date']),
            models.Index(fields=['date', 'status']),
        ]

    def save(self, *args, **kwargs):
        if self.clock_in and self.clock_out:
            from datetime import datetime, date as dt_date
            d = dt_date.today()
            start = datetime.combine(d, self.clock_in)
            end = datetime.combine(d, self.clock_out)
            delta = end - start
            self.work_hours = round(delta.seconds / 3600, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.username} - {self.date} ({self.status})"


class OvertimeRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Chờ duyệt'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
        ('cancelled', 'Đã hủy'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='overtime_requests')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    hours = models.DecimalField(max_digits=4, decimal_places=2, default=0)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='approved_overtimes'
    )
    approval_comment = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['date']),
        ]

    def save(self, *args, **kwargs):
        from datetime import datetime, date as dt_date
        d = dt_date.today()
        start = datetime.combine(d, self.start_time)
        end = datetime.combine(d, self.end_time)
        delta = end - start
        self.hours = round(delta.seconds / 3600, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.username} - OT {self.date} ({self.hours}h)"


class LatePardon(models.Model):
    """
    Request to pardon a late check-in so the employee is not fined.
    """
    STATUS_CHOICES = (
        ('pending', 'Chờ duyệt'),
        ('approved', 'Đã tha'),
        ('rejected', 'Từ chối – bị phạt'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance_record = models.OneToOneField(
        AttendanceRecord, on_delete=models.CASCADE, related_name='late_pardon'
    )
    reason = models.TextField(help_text="Lý do xin tha tội")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='late_pardons_reviewed'
    )
    approval_comment = models.TextField(blank=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Sync penalty on the linked attendance record
        record = self.attendance_record
        if self.status == 'approved':
            record.penalty_amount = 0
        elif record.late_minutes > 0:
            record.penalty_amount = LATE_PENALTY_AMOUNT
        record.save(update_fields=['penalty_amount', 'updated_at'])

    def __str__(self):
        return f"{self.attendance_record} – pardon ({self.status})"
