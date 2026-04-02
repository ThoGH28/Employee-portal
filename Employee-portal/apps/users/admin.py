from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.users.models import CustomUser, RefreshTokenLog


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
