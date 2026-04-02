"""
Chat models for AI chatbot
"""
from django.db import models
from apps.users.models import CustomUser
import uuid


class ChatSession(models.Model):
    """
    Chat session between user and AI
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='chat_sessions')
    title = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
    
    def __str__(self):
        return self.title or f"Chat {self.id}"


class ChatMessage(models.Model):
    """
    Individual chat messages
    """
    MESSAGE_ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
        ('system', 'System'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=MESSAGE_ROLE_CHOICES)
    content = models.TextField()
    tokens_used = models.IntegerField(blank=True, null=True)
    sources = models.JSONField(default=list, blank=True)  # Source documents used for context
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.role}: {self.content[:50]}"


class ChatFeedback(models.Model):
    """
    User feedback on AI responses
    """
    RATING_CHOICES = (
        (1, 'Very Bad'),
        (2, 'Bad'),
        (3, 'Neutral'),
        (4, 'Good'),
        (5, 'Very Good'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.OneToOneField(ChatMessage, on_delete=models.CASCADE, related_name='feedback')
    rating = models.IntegerField(choices=RATING_CHOICES)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Feedback: {self.get_rating_display()}"
