"""
JWT Authentication for Employee Portal
"""
import jwt
import logging
from django.conf import settings
from datetime import datetime, timedelta
from rest_framework.authentication import TokenAuthentication, BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from apps.users.models import CustomUser

logger = logging.getLogger(__name__)


class JWTAuthentication(BaseAuthentication):
    """
    JWT Token Authentication for DRF
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', None)
        
        if not auth_header:
            return None
        
        try:
            prefix, token = auth_header.split()
            
            if prefix.lower() != 'bearer':
                raise AuthenticationFailed('Invalid token header format')
            
            # Decode JWT token
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
            )
            
            user_id = payload.get('user_id')
            if not user_id:
                raise AuthenticationFailed('Invalid token payload')
            
            user = CustomUser.objects.get(id=user_id)
            
            if not user.is_active:
                raise AuthenticationFailed('User account is disabled')
            
            return (user, token)
        
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired')
        except jwt.DecodeError:
            raise AuthenticationFailed('Invalid token')
        except CustomUser.DoesNotExist:
            raise AuthenticationFailed('User not found')
        except ValueError:
            raise AuthenticationFailed('Invalid authentication header')


def generate_tokens(user):
    """
    Generate access and refresh JWT tokens
    """
    now = datetime.utcnow()
    
    # Access token
    access_payload = {
        'user_id': str(user.id),
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'exp': now + settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'],
        'iat': now,
        'type': 'access'
    }
    
    access_token = jwt.encode(
        access_payload,
        settings.SECRET_KEY,
        algorithm=settings.SIMPLE_JWT['ALGORITHM']
    )
    
    # Refresh token
    refresh_payload = {
        'user_id': str(user.id),
        'exp': now + settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'],
        'iat': now,
        'type': 'refresh'
    }
    
    refresh_token = jwt.encode(
        refresh_payload,
        settings.SECRET_KEY,
        algorithm=settings.SIMPLE_JWT['ALGORITHM']
    )
    
    return {
        'access': access_token,
        'refresh': refresh_token,
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'effective_role': user.get_effective_role(),
            'first_name': user.first_name,
            'last_name': user.last_name,
            'department': user.get_department(),
            'is_department_manager': user.is_department_manager(),
        }
    }
