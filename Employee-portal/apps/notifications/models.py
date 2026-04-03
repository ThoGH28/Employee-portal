"""
In-app notifications
"""
from django.db import models
from apps.users.models import CustomUser
import uuid


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('leave_request', 'Đơn nghỉ phép'),
        ('leave_approved', 'Nghỉ phép được duyệt'),
        ('leave_rejected', 'Nghỉ phép bị từ chối'),
        ('wfh_request', 'Đơn WFH'),
        ('wfh_approved', 'WFH được duyệt'),
        ('overtime_request', 'Đơn tăng ca'),
        ('overtime_approved', 'Tăng ca được duyệt'),
        ('expense_submitted', 'Đơn hoàn tiền gửi'),
        ('expense_approved', 'Hoàn tiền được duyệt'),
        ('payslip_available', 'Phiếu lương mới'),
        ('announcement', 'Thông báo mới'),
        ('contract_expiring', 'Hợp đồng sắp hết hạn'),
        ('admin_request', 'Yêu cầu hành chính'),
        ('performance_review', 'Đánh giá hiệu suất'),
        ('training_enroll', 'Đăng ký đào tạo'),
        ('asset_assigned', 'Bàn giao tài sản'),
        ('general', 'Thông báo chung'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notifications')
    sender = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='sent_notifications'
    )
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES, default='general')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['recipient', 'created_at']),
        ]

    def __str__(self):
        return f"[{self.notification_type}] -> {self.recipient.username}: {self.title}"
