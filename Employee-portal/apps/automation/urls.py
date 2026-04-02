"""
URLs for automation
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.automation import views

router = DefaultRouter()
router.register(r'tasks', views.AutomationTaskViewSet, basename='automation-task')
router.register(r'summaries', views.DocumentSummaryViewSet, basename='document-summary')
router.register(r'announcements', views.GeneratedAnnouncementViewSet, basename='generated-announcement')

urlpatterns = [
    path('', include(router.urls)),
]
