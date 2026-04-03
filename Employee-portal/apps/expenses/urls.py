from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.expenses import views

router = DefaultRouter()
router.register(r'reports', views.ExpenseReportViewSet, basename='expense-report')
router.register(r'items', views.ExpenseItemViewSet, basename='expense-item')

urlpatterns = [
    path('', include(router.urls)),
]
