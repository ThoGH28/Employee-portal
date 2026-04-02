"""
Serializers for document management
"""
from rest_framework import serializers
from django.core.files.storage import default_storage
from apps.documents.models import Document, DocumentChunk, DocumentMetadata


class DocumentChunkSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentChunk model
    """
    class Meta:
        model = DocumentChunk
        fields = ['id', 'chunk_index', 'content', 'token_count']


class DocumentMetadataSerializer(serializers.ModelSerializer):
    """
    Serializer for DocumentMetadata model
    """
    class Meta:
        model = DocumentMetadata
        fields = [
            'id', 'author', 'keywords', 'language', 'page_count',
            'word_count', 'is_confidential', 'tags'
        ]


class DocumentSerializer(serializers.ModelSerializer):
    """
    Serializer for Document model
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    metadata = DocumentMetadataSerializer(read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'department', 'document_type', 'file', 'file_size',
            'file_type', 'uploaded_by', 'uploaded_by_name', 'status', 'is_indexed',
            'metadata', 'created_at', 'updated_at', 'indexed_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'file_type', 'uploaded_by', 'uploaded_by_name',
            'status', 'is_indexed', 'created_at', 'updated_at', 'indexed_at'
        ]


class DocumentUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for document upload
    """
    class Meta:
        model = Document
        fields = ['title', 'description', 'department', 'document_type', 'file']
    
    def validate_file(self, value):
        """Validate file"""
        from django.conf import settings
        
        # Check file size
        if value.size > settings.MAX_DOCUMENT_SIZE:
            raise serializers.ValidationError(
                f"File size exceeds maximum allowed size of {settings.MAX_DOCUMENT_SIZE} bytes"
            )
        
        # Check file type
        file_ext = value.name.split('.')[-1].lower()
        if file_ext not in settings.ALLOWED_DOCUMENT_TYPES:
            raise serializers.ValidationError(
                f"File type '{file_ext}' is not allowed. Allowed types: {', '.join(settings.ALLOWED_DOCUMENT_TYPES)}"
            )
        
        return value
    
    def create(self, validated_data):
        validated_data['uploaded_by'] = self.context['request'].user
        validated_data['file_size'] = validated_data['file'].size
        validated_data['file_type'] = validated_data['file'].name.split('.')[-1].lower()
        return super().create(validated_data)


class DocumentSearchSerializer(serializers.Serializer):
    """
    Serializer for document search results
    """
    document = DocumentSerializer()
    relevance_score = serializers.FloatField()
    matched_chunk = serializers.CharField()
