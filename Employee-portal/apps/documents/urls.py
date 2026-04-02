"""
URLs for document management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.documents import views

router = DefaultRouter()
router.register(r'', views.DocumentViewSet, basename='document')
router.register(r'search', views.DocumentSearchViewSet, basename='document-search')

urlpatterns = [
    path('', include(router.urls)),
]
