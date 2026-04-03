"""
Views for user authentication
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.contrib.auth import authenticate
import logging

from apps.users.models import CustomUser, LoginLog
from apps.users.serializers import (
    UserSerializer,
    UserRegisterSerializer,
    LoginSerializer,
    RefreshTokenSerializer,
    ChangePasswordSerializer,
    LoginLogSerializer,
)

logger = logging.getLogger(__name__)


def _get_client_ip(request):
    """Extract real client IP, respecting X-Forwarded-For from trusted proxies."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user management
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        if user.role == 'admin':
            return CustomUser.objects.all()
        return CustomUser.objects.filter(id=user.id)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    User registration endpoint
    """
    if request.method == 'POST':
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"New user registered: {user.username}")
            return Response(
                {'message': 'User registered successfully', 'user': UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    User login endpoint - returns JWT tokens
    """
    if request.method == 'POST':
        serializer = LoginSerializer(data=request.data)
        ip = _get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        username_attempted = request.data.get('email') or request.data.get('username', '')

        if serializer.is_valid():
            user = serializer.user
            LoginLog.objects.create(
                user=user,
                username_attempted=username_attempted,
                ip_address=ip,
                user_agent=user_agent,
                status='success',
            )
            logger.info(f"User logged in: {user.username}")
            return Response(serializer.data, status=status.HTTP_200_OK)

        LoginLog.objects.create(
            user=None,
            username_attempted=username_attempted,
            ip_address=ip,
            user_agent=user_agent,
            status='failed',
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token_view(request):
    """
    Refresh access token endpoint
    """
    if request.method == 'POST':
        serializer = RefreshTokenSerializer(data=request.data)
        if serializer.is_valid():
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Get current user profile
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Update current user profile
    """
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        logger.info(f"User profile updated: {user.username}")
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Change password endpoint
    """
    serializer = ChangePasswordSerializer(
        request.user,
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        logger.info(f"User changed password: {request.user.username}")
        return Response({'message': 'Password changed successfully'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Logout endpoint (for audit purposes)
    """
    logger.info(f"User logged out: {request.user.username}")
    return Response({'message': 'Logged out successfully'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def impersonate_view(request):
    """
    Admin-only endpoint to impersonate another user.
    Returns new tokens for the target user while logging the action.
    """
    from apps.users.authentication import generate_tokens

    if request.user.role != 'admin':
        return Response(
            {'detail': 'Only administrators can impersonate users'},
            status=status.HTTP_403_FORBIDDEN
        )

    target_user_id = request.data.get('user_id')
    if not target_user_id:
        return Response(
            {'detail': 'user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        target_user = CustomUser.objects.get(id=target_user_id)
    except CustomUser.DoesNotExist:
        return Response(
            {'detail': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    if not target_user.is_active:
        return Response(
            {'detail': 'Cannot impersonate inactive user'},
            status=status.HTTP_400_BAD_REQUEST
        )

    logger.warning(
        f"IMPERSONATE: Admin {request.user.username} (id={request.user.id}) "
        f"impersonating user {target_user.username} (id={target_user.id})"
    )

    tokens = generate_tokens(target_user)
    tokens['impersonated_by'] = {
        'id': str(request.user.id),
        'username': request.user.username,
    }
    return Response(tokens)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_logs_view(request):
    """
    Admin-only endpoint to retrieve login audit logs.
    Supports optional query params: user_id, status (success|failed), page, page_size
    """
    if request.user.role != 'admin':
        return Response({'detail': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    logs = LoginLog.objects.select_related('user').all()

    user_id = request.query_params.get('user_id')
    status_filter = request.query_params.get('status')
    if user_id:
        logs = logs.filter(user_id=user_id)
    if status_filter in ('success', 'failed'):
        logs = logs.filter(status=status_filter)

    try:
        page = max(1, int(request.query_params.get('page', 1)))
        page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
    except (ValueError, TypeError):
        page, page_size = 1, 20

    total = logs.count()
    start = (page - 1) * page_size
    serializer = LoginLogSerializer(logs[start:start + page_size], many=True)
    return Response({'count': total, 'results': serializer.data})
