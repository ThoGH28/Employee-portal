from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.performance import views

router = DefaultRouter()
router.register(r'kpi', views.KPIGoalViewSet, basename='kpi-goal')
router.register(r'reviews', views.PerformanceReviewViewSet, basename='performance-review')

urlpatterns = [
    path('', include(router.urls)),
]
