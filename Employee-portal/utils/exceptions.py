"""
Custom exceptions for the application
"""


class DocumentProcessingError(Exception):
    """Raised when document processing fails"""
    pass


class VectorDatabaseError(Exception):
    """Raised when vector database operations fail"""
    pass


class AIServiceError(Exception):
    """Raised when AI service calls fail"""
    pass


class AuthenticationError(Exception):
    """Raised when authentication fails"""
    pass


class PermissionDeniedError(Exception):
    """Raised when user doesn't have permission"""
    pass
