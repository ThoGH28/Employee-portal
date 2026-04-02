from django.contrib import admin
from apps.documents.models import Document, DocumentChunk, DocumentMetadata, DocumentAccessLog


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'document_type', 'status', 'is_indexed', 'uploaded_by', 'created_at']
    list_filter = ['status', 'document_type', 'is_indexed', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at', 'indexed_at', 'status']


@admin.register(DocumentChunk)
class DocumentChunkAdmin(admin.ModelAdmin):
    list_display = ['document', 'chunk_index', 'token_count']
    list_filter = ['document']
    search_fields = ['document__title']
    readonly_fields = ['created_at']


@admin.register(DocumentMetadata)
class DocumentMetadataAdmin(admin.ModelAdmin):
    list_display = ['document', 'language', 'is_confidential']
    list_filter = ['language', 'is_confidential']
    search_fields = ['document__title']


@admin.register(DocumentAccessLog)
class DocumentAccessLogAdmin(admin.ModelAdmin):
    list_display = ['document', 'user', 'action', 'accessed_at']
    list_filter = ['action', 'accessed_at']
    search_fields = ['document__title', 'user__username']
    readonly_fields = ['accessed_at']
