"""
LangChain conversational retrieval chain for AI chatbot
"""
import logging
from typing import List, Dict, Any
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_core.prompts import PromptTemplate
from django.conf import settings

logger = logging.getLogger(__name__)


class EmployeePortalChatChain:
    """
    Conversational retrieval chain for HR document Q&A
    """
    
    def __init__(self):
        """Initialize the chat chain"""
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model_name=settings.OPENAI_MODEL,
            temperature=0.7,
            max_tokens=1500
        )
        
        self.system_prompt = """You are a helpful HR Assistant for an employee portal. 
Your role is to help employees find information about company policies, procedures, 
and HR-related matters. Be professional, concise, and friendly in your responses.

When answering questions:
1. Use the provided documents as your primary source of information
2. If you don't find the information in the documents, say so clearly
3. Provide accurate, company-specific information
4. Ask clarifying questions if the employee's question is unclear
5. Always be helpful and supportive

Context from company documents will be provided below."""
    
    def create_retrieval_chain(self, retriever):
        """
        Create a conversational retrieval chain
        
        Args:
            retriever: Document retriever from vector database
        
        Returns:
            ConversationalRetrievalChain instance
        """
        # System prompt for the chain
        condense_prompt = PromptTemplate(
            input_variables=["chat_history", "question"],
            template="""Given the following conversation and a follow up question, 
rephrase the follow up question to be a standalone question.

Chat History:
{chat_history}

Follow Up Input: {question}

Standalone question:"""
        )
        
        qa_prompt = PromptTemplate(
            input_variables=["context", "question", "chat_history"],
            template=f"""{self.system_prompt}

Context (relevant documents):
{{context}}

Chat History:
{{chat_history}}

Employee Question: {{question}}

Assistant Response:"""
        )
        
        # Create memory
        memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Create chain
        chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=retriever,
            memory=memory,
            condense_question_prompt=condense_prompt,
            combine_docs_chain_kwargs={"prompt": qa_prompt},
            return_source_documents=True,
            verbose=True
        )
        
        return chain
    
    def format_sources(self, source_documents: List) -> List[Dict[str, Any]]:
        """
        Format source documents for response
        
        Args:
            source_documents: List of source documents from retriever
        
        Returns:
            Formatted source list
        """
        sources = []
        for doc in source_documents:
            sources.append({
                'title': doc.metadata.get('title', 'Unknown'),
                'document_id': doc.metadata.get('document_id'),
                'excerpt': doc.page_content[:200] + '...' if len(doc.page_content) > 200 else doc.page_content
            })
        return sources


def get_chat_response(
    question: str,
    chat_history: List[Dict[str, str]],
    retriever
) -> Dict[str, Any]:
    """
    Get response from chat chain
    
    Args:
        question: User question
        chat_history: List of previous messages
        retriever: Document retriever
    
    Returns:
        Dict with response and metadata
    """
    try:
        chain_instance = EmployeePortalChatChain()
        chain = chain_instance.create_retrieval_chain(retriever)
        
        # Convert chat history to LangChain format
        formatted_history = ""
        for msg in chat_history[-5:]:  # Last 5 messages
            if msg['role'] == 'user':
                formatted_history += f"Employee: {msg['content']}\n"
            else:
                formatted_history += f"Assistant: {msg['content']}\n"
        
        # Get response
        result = chain({
            "question": question,
            "chat_history": formatted_history
        })
        
        logger.info(f"Chat response generated successfully")
        
        return {
            'answer': result['answer'],
            'sources': chain_instance.format_sources(result.get('source_documents', [])),
            'success': True
        }
    
    except Exception as e:
        logger.error(f"Error getting chat response: {str(e)}")
        return {
            'answer': f"I apologize, but I encountered an error processing your question: {str(e)}",
            'sources': [],
            'success': False
        }
