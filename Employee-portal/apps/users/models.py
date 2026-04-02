"""
User models for authentication
"""
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import EmailValidator
import uuid


class CustomUser(AbstractUser):
    """
    Custom user model extending Django's AbstractUser
    """
    ROLE_CHOICES = (
        ('admin', 'Administrator'),
        ('employee', 'Employee'),
        ('hr', 'HR Manager'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_employee(self):
        return self.role == 'employee'
    
    def is_hr(self):
        return self.role == 'hr'

    def is_department_manager(self):
        """Check if user is a department manager (has direct reports)"""
        try:
            return self.profile.direct_reports.exists()
        except Exception:
            return False

    def get_department(self):
        """Get user's department from their employee profile"""
        try:
            return self.profile.department
        except Exception:
            return None

    def get_effective_role(self):
        """
        Get effective role considering manager status.
        Returns: 'admin', 'hr', 'dept_manager', or 'employee'
        """
        if self.role in ('admin', 'hr'):
            return self.role
        if self.is_department_manager():
            return 'dept_manager'
        return 'employee'


class RefreshTokenLog(models.Model):
    """
    Log refresh token usage for audit purposes
    """
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='token_logs')
    token = models.TextField()
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    revoked = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return f"Token log for {self.user} at {self.created_at}"
