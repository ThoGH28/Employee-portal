"""
URLs for semantic search
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.search import views

router = DefaultRouter()
router.register(r'', views.SemanticSearchViewSet, basename='search')

urlpatterns = router.urls
