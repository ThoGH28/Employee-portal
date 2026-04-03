"""
Vector database utilities for document embedding and retrieval
"""
import logging
import os
from typing import List, Dict, Any, Optional
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from django.conf import settings

logger = logging.getLogger(__name__)


class VectorDB:
    """
    Vector database interface using Chroma
    """
    
    def __init__(self):
        """Initialize vector database"""
        try:
            self.embeddings = OpenAIEmbeddings(
                openai_api_key=settings.OPENAI_API_KEY,
                model='text-embedding-3-small'
            )
            
            # Create or connect to existing collection
            self.db = Chroma(
                collection_name=settings.VECTOR_DB_COLLECTION,
                embedding_function=self.embeddings,
                persist_directory=settings.VECTOR_DB_PATH,
                client_settings=None
            )
            
            logger.info("Vector database initialized successfully")
        
        except Exception as e:
            logger.error(f"Error initializing vector database: {str(e)}")
            raise
    
    def add_documents(
        self,
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ) -> List[str]:
        """
        Add documents to vector database
        
        Args:
            texts: List of document texts/chunks
            metadatas: List of metadata dicts
            ids: List of document IDs
        
        Returns:
            List of added document IDs
        """
        try:
            added_ids = self.db.add_texts(
                texts=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            logger.info(f"Added {len(added_ids)} documents to vector database")
            return added_ids
        
        except Exception as e:
            logger.error(f"Error adding documents to vector database: {str(e)}")
            raise
    
    def search(
        self,
        query: str,
        top_k: int = 10,
        threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Search vector database
        
        Args:
            query: Search query string
            top_k: Number of results to return
            threshold: Relevance threshold
        
        Returns:
            List of search results with relevance scores
        """
        try:
            # Search with similarity scores
            results = self.db.similarity_search_with_score(
                query=query,
                k=top_k
            )
            
            formatted_results = []
            for doc, score in results:
                # Convert distance score to relevance (0-1)
                relevance = 1 - (score / 2)  # Normalize for similarity
                
                if relevance >= threshold:
                    formatted_results.append({
                        'id': doc.metadata.get('document_id', ''),
                        'title': doc.metadata.get('title', ''),
                        'excerpt': doc.page_content[:300],
                        'content': doc.page_content,
                        'relevance_score': relevance,
                        'metadata': doc.metadata
                    })
            
            logger.info(f"Search completed: found {len(formatted_results)} relevant results")
            return formatted_results
        
        except Exception as e:
            logger.error(f"Error searching vector database: {str(e)}")
            raise
    
    def get_retriever(self):
        """
        Get LangChain retriever for use with chains
        
        Returns:
            Chroma retriever instance
        """
        return self.db.as_retriever(
            search_kwargs={"k": 5}
        )
    
    def delete_document(self, document_id: str) -> bool:
        """
        Delete document from vector database
        
        Args:
            document_id: Document ID to delete
        
        Returns:
            Success status
        """
        try:
            # Get all IDs associated with this document
            results = self.db.get(
                where={"document_id": document_id}
            )
            
            if results['ids']:
                self.db.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
                return True
            
            return False
        
        except Exception as e:
            logger.error(f"Error deleting from vector database: {str(e)}")
            raise
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about vector database collection
        
        Returns:
            Collection statistics
        """
        try:
            collection_size = self.db._collection.count()
            
            return {
                'collection_name': settings.VECTOR_DB_COLLECTION,
                'total_documents': collection_size,
                'total_chunks': collection_size,
                'embedding_dimension': 1536  # OpenAI embedding size
            }
        
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")
            return {
                'error': str(e),
                'collection_name': settings.VECTOR_DB_COLLECTION
            }
