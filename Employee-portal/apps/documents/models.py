"""
Document models for HR document management
"""
from django.db import models
from apps.users.models import CustomUser
from apps.employees.models import EmployeeProfile
import uuid


class Document(models.Model):
    """
    HR document storage model
    """
    STATUS_CHOICES = (
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('indexed', 'Indexed'),
        ('failed', 'Failed'),
    )
    
    DEPARTMENT_CHOICES = EmployeeProfile.DEPARTMENT_CHOICES + (
        ('company', 'Toàn công ty'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    department = models.CharField(
        max_length=50,
        choices=DEPARTMENT_CHOICES,
        default='company',
        help_text="Department this document belongs to, or 'company' for company-wide"
    )
    document_type = models.CharField(
        max_length=50,
        choices=[
            ('policy', 'Policy'),
            ('announcement', 'Announcement'),
            ('handbook', 'Handbook'),
            ('form', 'Form'),
            ('other', 'Other'),
        ]
    )
    file = models.FileField(upload_to='documents/%Y/%m/%d/')
    file_size = models.BigIntegerField()
    file_type = models.CharField(max_length=10)  # pdf, docx, doc, txt
    uploaded_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='uploaded_documents')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    vector_db_id = models.CharField(max_length=255, blank=True, null=True)  # ID in vector DB
    is_indexed = models.BooleanField(default=False)
    extracted_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    indexed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_indexed']),
            models.Index(fields=['document_type']),
            models.Index(fields=['uploaded_by']),
        ]
    
    def __str__(self):
        return self.title


class DocumentChunk(models.Model):
    """
    Chunks of documents for vector embedding
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    chunk_index = models.IntegerField()
    content = models.TextField()
    token_count = models.IntegerField()
    embedding_id = models.CharField(max_length=255, blank=True, null=True)  # ID in vector DB
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['document', 'chunk_index']
        unique_together = ['document', 'chunk_index']
        indexes = [
            models.Index(fields=['document']),
        ]
    
    def __str__(self):
        return f"{self.document.title} - Chunk {self.chunk_index}"


class DocumentMetadata(models.Model):
    """
    Metadata about documents for search and filtering
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.OneToOneField(Document, on_delete=models.CASCADE, related_name='metadata')
    author = models.CharField(max_length=255, blank=True)
    keywords = models.TextField(blank=True)  # Comma-separated
    language = models.CharField(max_length=10, default='en')
    page_count = models.IntegerField(blank=True, null=True)
    word_count = models.IntegerField(blank=True, null=True)
    is_confidential = models.BooleanField(default=False)
    tags = models.TextField(blank=True)  # Comma-separated for filtering
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Metadata for {self.document.title}"


class DocumentAccessLog(models.Model):
    """
    Log document access for audit purposes
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='access_logs')
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True)
    action = models.CharField(
        max_length=50,
        choices=[
            ('view', 'View'),
            ('download', 'Download'),
            ('search', 'Search'),
            ('ai_query', 'AI Query'),
        ]
    )
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    accessed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-accessed_at']
        indexes = [
            models.Index(fields=['document', 'accessed_at']),
            models.Index(fields=['user', 'accessed_at']),
        ]
    
    def __str__(self):
        return f"{self.document.title} - {self.action} by {self.user}"
