"""
Serializers for automation
"""
from rest_framework import serializers
from apps.automation.models import AutomationTask, DocumentSummary, GeneratedAnnouncement


class AutomationTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for AutomationTask model
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    document_title = serializers.CharField(source='document.title', read_only=True)
    
    class Meta:
        model = AutomationTask
        fields = [
            'id', 'task_type', 'status', 'created_by', 'created_by_name',
            'document', 'document_title', 'input_data', 'output_data',
            'error_message', 'created_at', 'started_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'status', 'output_data', 'error_message',
            'created_at', 'started_at', 'completed_at'
        ]


class DocumentSummarySerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentSummary model
    """
    document_title = serializers.CharField(source='document.title', read_only=True)
    
    class Meta:
        model = DocumentSummary
        fields = [
            'id', 'document', 'document_title', 'summary', 'length_type',
            'key_points', 'generated_by', 'generated_at', 'updated_at'
        ]
        read_only_fields = ['id', 'generated_at', 'updated_at']


class GeneratedAnnouncementSerializer(serializers.ModelSerializer):
    """
    Serializer for GeneratedAnnouncement model
    """
    source_document_title = serializers.CharField(source='source_document.title', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = GeneratedAnnouncement
        fields = [
            'id', 'source_document', 'source_document_title', 'title', 'content',
            'summary', 'is_published', 'generated_by', 'generated_by_name',
            'approved_by', 'approved_by_name', 'generated_at', 'approved_at'
        ]
        read_only_fields = [
            'id', 'source_document_title', 'generated_by_name',
            'approved_by_name', 'generated_at'
        ]


class SummarizeDocumentSerializer(serializers.Serializer):
    """
    Serializer for document summarization request
    """
    document_id = serializers.UUIDField()
    length = serializers.ChoiceField(
        choices=['short', 'medium', 'long'],
        default='medium'
    )


class GenerateAnnouncementSerializer(serializers.Serializer):
    """
    Serializer for announcement generation request
    """
    document_id = serializers.UUIDField()


class ApproveAnnouncementSerializer(serializers.Serializer):
    """
    Serializer for announcement approval
    """
    announcement_id = serializers.UUIDField()
    is_approved = serializers.BooleanField()
    comment = serializers.CharField(required=False, allow_blank=True)
