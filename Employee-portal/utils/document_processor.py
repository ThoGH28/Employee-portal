"""
Document processing utilities and Celery tasks
"""
import logging
from django.utils import timezone
from django.conf import settings
from apps.documents.models import Document, DocumentChunk, DocumentMetadata
from apps.documents.doc_processor import DocumentProcessor, TextProcessor

logger = logging.getLogger(__name__)


def process_document_sync(document_id: str) -> bool:
    """
    Process document synchronously
    
    Args:
        document_id: Document ID to process
    
    Returns:
        Success status
    """
    try:
        document = Document.objects.get(id=document_id)
        
        # Update status
        document.status = 'processing'
        document.save()
        
        logger.info(f"Starting processing for document {document_id}")
        
        # Extract text
        file_path = document.file.path
        text, word_count = DocumentProcessor.extract_text(file_path, document.file_type)
        
        # Clean and store text
        cleaned_text = TextProcessor.clean_text(text)
        document.extracted_text = cleaned_text
        
        # Extract keywords
        keywords = TextProcessor.extract_keywords(cleaned_text)
        
        # Chunk document
        chunks = DocumentProcessor.chunk_text(
            cleaned_text,
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        
        # Index to vector database
        from utils.vector_db import VectorDB
        
        vector_db = VectorDB()
        
        chunk_objects = []
        texts = []
        metadatas = []
        ids = []
        
        for idx, chunk_text in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{idx}"
            
            # Create chunk object
            chunk_obj, _ = DocumentChunk.objects.update_or_create(
                document=document,
                chunk_index=idx,
                defaults={
                    'content': chunk_text,
                    'token_count': len(chunk_text.split()),
                    'embedding_id': chunk_id
                }
            )
            chunk_objects.append(chunk_obj)
            
            # Prepare for vector DB
            texts.append(chunk_text)
            metadatas.append({
                'document_id': str(document.id),
                'document_title': document.title,
                'chunk_index': idx,
                'chunk_count': len(chunks),
                'file_type': document.file_type,
                'document_type': document.document_type,
                'keywords': ', '.join(keywords)
            })
            ids.append(chunk_id)
        
        # Add to vector database
        added_ids = vector_db.add_documents(texts, metadatas, ids)
        
        # Create or update metadata
        DocumentMetadata.objects.update_or_create(
            document=document,
            defaults={
                'author': document.uploaded_by.get_full_name() if document.uploaded_by else 'Unknown',
                'keywords': ', '.join(keywords),
                'word_count': word_count,
                'is_confidential': False
            }
        )
        
        # Update document
        document.status = 'indexed'
        document.is_indexed = True
        document.vector_db_id = str(document.id)
        document.indexed_at = timezone.now()
        document.save()
        
        logger.info(f"Successfully processed and indexed document {document_id}")
        return True
    
    except Exception as e:
        logger.error(f"Error processing document {document_id}: {str(e)}")
        
        # Mark as failed
        try:
            document = Document.objects.get(id=document_id)
            document.status = 'failed'
            document.save()
        except:
            pass
        
        return False


# Celery task (optional, if using Celery)
try:
    from celery import shared_task
    
    @shared_task
    def process_document_task(document_id: str):
        """Celery task for document processing"""
        return process_document_sync(document_id)

except ImportError:
    # Celery not installed
    def process_document_task(document_id: str):
        """Fallback if Celery not available"""
        return process_document_sync(document_id)
