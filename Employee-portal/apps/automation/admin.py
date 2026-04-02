from django.contrib import admin
from apps.automation.models import AutomationTask, DocumentSummary, GeneratedAnnouncement


@admin.register(AutomationTask)
class AutomationTaskAdmin(admin.ModelAdmin):
    list_display = ['task_type', 'status', 'created_by', 'created_at']
    list_filter = ['task_type', 'status', 'created_at']
    search_fields = ['created_by__username']
    readonly_fields = ['created_at', 'started_at', 'completed_at']


@admin.register(DocumentSummary)
class DocumentSummaryAdmin(admin.ModelAdmin):
    list_display = ['document', 'length_type', 'generated_at']
    list_filter = ['length_type', 'generated_at']
    search_fields = ['document__title']
    readonly_fields = ['generated_at', 'updated_at']


@admin.register(GeneratedAnnouncement)
class GeneratedAnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_published', 'generated_at', 'approved_by']
    list_filter = ['is_published', 'generated_at']
    search_fields = ['title', 'content']
    readonly_fields = ['generated_at']
