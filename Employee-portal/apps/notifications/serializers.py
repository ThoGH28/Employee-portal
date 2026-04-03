from rest_framework import serializers
from apps.notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True, default='Hệ thống')
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_name',
            'notification_type', 'notification_type_display',
            'title', 'message', 'is_read', 'related_url',
            'created_at', 'read_at',
        ]
        read_only_fields = ['id', 'recipient', 'sender', 'created_at', 'read_at']
