"""
URLs for chat
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.chat import views

router = DefaultRouter()
router.register(r'sessions', views.ChatSessionViewSet, basename='chat-session')
router.register(r'feedback', views.ChatFeedbackViewSet, basename='chat-feedback')
router.register(r'employee-lookup', views.EmployeeLookupViewSet, basename='employee-lookup')

urlpatterns = [
    path('', include(router.urls)),
]
