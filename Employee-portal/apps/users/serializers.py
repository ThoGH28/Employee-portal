"""
Serializers for user authentication
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from apps.users.models import CustomUser
from apps.users.authentication import generate_tokens


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for CustomUser model
    """
    department = serializers.SerializerMethodField()
    is_department_manager = serializers.SerializerMethodField()
    effective_role = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role',
                  'effective_role', 'department', 'is_department_manager',
                  'phone_number', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_department(self, obj):
        return obj.get_department()

    def get_is_department_manager(self, obj):
        return obj.is_department_manager()

    def get_effective_role(self, obj):
        return obj.get_effective_role()


class UserRegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 
                  'last_name', 'phone_number']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError('Passwords do not match')
        
        # Check if user exists
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError('User with this email already exists')
        
        if CustomUser.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError('Username already taken')
        
        return attrs
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', '')
        )
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login - accepts email or username
    """
    email = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        email = attrs.get('email')
        username = attrs.get('username')
        password = attrs.get('password')
        
        # Try to authenticate with email or username
        if email:
            try:
                user = CustomUser.objects.get(email=email)
                self.user = authenticate(username=user.username, password=password)
            except CustomUser.DoesNotExist:
                self.user = None
        elif username:
            self.user = authenticate(username=username, password=password)
        else:
            raise serializers.ValidationError('Email or username is required')
        
        if not self.user:
            raise serializers.ValidationError('Invalid credentials')
        
        if not self.user.is_active:
            raise serializers.ValidationError('User account is disabled')
        
        return attrs
    
    def to_representation(self, instance):
        tokens = generate_tokens(self.user)
        return tokens


class RefreshTokenSerializer(serializers.Serializer):
    """
    Serializer for refreshing access token
    """
    refresh = serializers.CharField()
    
    def validate_refresh(self, value):
        import jwt
        from django.conf import settings
        
        try:
            payload = jwt.decode(
                value,
                settings.SECRET_KEY,
                algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
            )
            
            if payload.get('type') != 'refresh':
                raise serializers.ValidationError('Invalid token type')
            
        except jwt.ExpiredSignatureError:
            raise serializers.ValidationError('Token has expired')
        except jwt.DecodeError:
            raise serializers.ValidationError('Invalid token')
        
        return value
    
    def to_representation(self, instance):
        import jwt
        from django.conf import settings
        from datetime import datetime
        
        refresh_token = self.validated_data['refresh']
        payload = jwt.decode(
            refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.SIMPLE_JWT['ALGORITHM']]
        )
        
        user_id = payload.get('user_id')
        user = CustomUser.objects.get(id=user_id)
        
        # Generate new access token
        now = datetime.utcnow()
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
        
        return {'access': access_token}


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing password
    """
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs.pop('new_password_confirm'):
            raise serializers.ValidationError('Passwords do not match')
        
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect')
        return value
    
    def update(self, instance, validated_data):
        instance.set_password(validated_data['new_password'])
        instance.save()
        return instance
