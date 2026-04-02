from django.contrib import admin
from apps.chat.models import ChatSession, ChatMessage, ChatFeedback


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'created_at', 'updated_at', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['session__user__username', 'content']
    readonly_fields = ['created_at']


@admin.register(ChatFeedback)
class ChatFeedbackAdmin(admin.ModelAdmin):
    list_display = ['message', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    readonly_fields = ['created_at']
