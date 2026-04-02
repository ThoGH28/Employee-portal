"""
Automation models for AI-powered tasks
"""
from django.db import models
from apps.users.models import CustomUser
from apps.documents.models import Document
import uuid


class AutomationTask(models.Model):
    """
    Automated task execution history
    """
    TASK_TYPE_CHOICES = (
        ('summarize', 'Summarize Document'),
        ('generate_announcement', 'Generate Announcement'),
        ('extract_insights', 'Extract Insights'),
        ('custom', 'Custom Task'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task_type = models.CharField(max_length=50, choices=TASK_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    input_data = models.JSONField(default=dict)
    output_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    task_id = models.CharField(max_length=255, blank=True)  # Celery task ID
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['task_type', 'status']),
            models.Index(fields=['created_by', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_task_type_display()} - {self.status}"


class DocumentSummary(models.Model):
    """
    AI-generated summaries of documents
    """
    SUMMARY_LENGTH_CHOICES = (
        ('short', 'Short (50-100 words)'),
        ('medium', 'Medium (100-300 words)'),
        ('long', 'Long (300+ words)'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='ai_summary')
    summary = models.TextField()
    length_type = models.CharField(max_length=20, choices=SUMMARY_LENGTH_CHOICES)
    key_points = models.JSONField(default=list)
    generated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Summary of {self.document.title}"


class GeneratedAnnouncement(models.Model):
    """
    AI-generated HR announcements from documents
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_document = models.ForeignKey(Document, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    summary = models.TextField(blank=True)
    is_published = models.BooleanField(default=False)
    generated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    approved_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_auto_announcements'
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return self.title
