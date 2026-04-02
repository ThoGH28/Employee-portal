"""
AI agents for automation tasks using LangChain
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Langchain imports - commented out for now due to version conflicts
# from langchain.chat_models import ChatOpenAI
# from langchain.prompts import PromptTemplate
# from langchain.chains import LLMChain


class DocumentSummarizationAgent:
    """
    AI agent for summarizing documents
    """
    
    def __init__(self):
        # Langchain initialization - commented out for now
        # self.llm = ChatOpenAI(
        #     openai_api_key=settings.OPENAI_API_KEY,
        #     model_name=settings.OPENAI_MODEL,
        #     temperature=0.5,
        #     max_tokens=1500
        # )
        self.llm = None
    
    def summarize(self, text: str, length: str = 'medium') -> dict:
        """
        Summarize document text
        
        Args:
            text: Document text to summarize
            length: Summary length ('short', 'medium', 'long')
        
        Returns:
            Dict with summary and key points
        """
        try:
            # Simple summarization without LangChain for now
            sentences = text.split('.')
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
            
            # Take a portion of sentences as summary
            if length == 'short':
                summary = '. '.join(sentences[:2]) + '.'
            elif length == 'long':
                summary = '. '.join(sentences[:5]) + '.'
            else:  # medium
                summary = '. '.join(sentences[:3]) + '.'
            
            # Extract key points
            key_points = self._extract_key_points(text)
            
            logger.info("Document summarization completed successfully")
            
            return {
                'success': True,
                'summary': summary.strip(),
                'key_points': key_points
            }
        
        except Exception as e:
            logger.error(f"Error summarizing document: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @staticmethod
    def _extract_key_points(text: str, num_points: int = 5) -> list:
        """Extract key points from text"""
        sentences = text.split('.')
        sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
        
        # Simple heuristic: take sentences with more than 25 characters
        key_points = [s for s in sentences[:num_points] if len(s) > 25]
        
        return key_points[:num_points]


class AnnouncementGenerationAgent:
    """
    AI agent for generating HR announcements from documents
    """
    
    def __init__(self):
        # Langchain initialization - commented out for now
        # self.llm = ChatOpenAI(...)
        self.llm = None
    
    def generate_announcement(self, document_text: str, document_title: str) -> dict:
        """
        Generate HR announcement from document
        
        Args:
            document_text: Document content
            document_title: Document title
        
        Returns:
            Dict with announcement title and content
        """
        try:
            # Simple announcement generation without LangChain
            announcement_title = f"📢 {document_title}"
            
            # Take first few sentences as announcement
            sentences = document_text.split('.')
            sentences = [s.strip() for s in sentences if len(s.strip()) > 20]
            announcement_content = '. '.join(sentences[:3]) + '.'
            
            logger.info("Announcement generation completed successfully")
            
            return {
                'success': True,
                'title': announcement_title,
                'content': announcement_content
            }
        
        except Exception as e:
            logger.error(f"Error generating announcement: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


class InsightExtractionAgent:
    """
    AI agent for extracting insights from documents
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            openai_api_key=settings.OPENAI_API_KEY,
            model_name=settings.OPENAI_MODEL,
            temperature=0.6,
            max_tokens=1500
        )
    
    def extract_insights(self, text: str) -> dict:
        """
        Extract insights from document
        
        Args:
            text: Document text
        
        Returns:
            Dict with insights
        """
        try:
            prompt = PromptTemplate(
                input_variables=['text'],
                template="""Analyze the following HR document and extract key insights.
Provide insights in JSON format with the following structure:
{{
    "main_topics": ["topic1", "topic2", ...],
    "action_items": ["action1", "action2", ...],
    "affected_employees": "description of who this affects",
    "implementation_timeline": "timeline if mentioned",
    "key_benefits": ["benefit1", "benefit2", ...]
}}

Document Content:
{text}

Insights (JSON format):"""
            )
            
            chain = LLMChain(llm=self.llm, prompt=prompt)
            
            insights_text = chain.run(text=text[:3000])
            
            # Try to parse JSON
            import json
            try:
                insights = json.loads(insights_text)
            except json.JSONDecodeError:
                insights = {'raw_insights': insights_text}
            
            logger.info("Insight extraction completed successfully")
            
            return {
                'success': True,
                'insights': insights
            }
        
        except Exception as e:
            logger.error(f"Error extracting insights: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
