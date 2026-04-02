"""
Serializers for chat
"""
from rest_framework import serializers
from apps.chat.models import ChatSession, ChatMessage, ChatFeedback


class ChatMessageSerializer(serializers.ModelSerializer):
    """
    Serializer for ChatMessage model
    """
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'tokens_used', 'sources', 'created_at']
        read_only_fields = ['id', 'tokens_used', 'sources', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for ChatSession model
    """
    messages = ChatMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_active', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at', 'messages']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ChatMessageCreateSerializer(serializers.Serializer):
    """
    Serializer for creating chat messages
    """
    content = serializers.CharField(max_length=5000)
    session_id = serializers.UUIDField(required=False)
    
    def validate_content(self, value):
        if len(value.strip()) < 1:
            raise serializers.ValidationError("Message content cannot be empty")
        return value


class ChatFeedbackSerializer(serializers.ModelSerializer):
    """
    Serializer for ChatFeedback model
    """
    class Meta:
        model = ChatFeedback
        fields = ['id', 'message', 'rating', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatFeedbackCreateSerializer(serializers.Serializer):
    """
    Serializer for creating feedback
    """
    message_id = serializers.UUIDField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True)
