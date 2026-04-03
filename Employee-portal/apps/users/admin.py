from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import CustomUser, RefreshTokenLog, LoginLog


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'phone_number')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Role', {'fields': ('role',)}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )


@admin.register(RefreshTokenLog)
class RefreshTokenLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'revoked']
    list_filter = ['revoked', 'created_at']
    search_fields = ['user__username']
    readonly_fields = ['token', 'created_at']


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    list_display = ['username_attempted', 'user', 'ip_address', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['username_attempted', 'user__username', 'ip_address']
    readonly_fields = ['user', 'username_attempted', 'ip_address', 'user_agent', 'status', 'created_at']
