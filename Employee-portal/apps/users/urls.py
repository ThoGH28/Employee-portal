"""
URLs for user authentication
"""
from django.urls import path
from apps.users import views

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('refresh/', views.refresh_token_view, name='refresh-token'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.update_profile_view, name='update-profile'),
    path('change-password/', views.change_password_view, name='change-password'),
    path('logout/', views.logout_view, name='logout'),
    path('impersonate/', views.impersonate_view, name='impersonate'),
    path('login-logs/', views.login_logs_view, name='login-logs'),
]
