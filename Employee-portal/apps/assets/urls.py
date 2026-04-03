from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.assets import views

router = DefaultRouter()
router.register(r'items', views.CompanyAssetViewSet, basename='company-asset')
router.register(r'assignments', views.AssetAssignmentViewSet, basename='asset-assignment')

urlpatterns = [
    path('', include(router.urls)),
]
