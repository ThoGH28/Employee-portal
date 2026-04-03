from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.attendance import views

router = DefaultRouter()
router.register(r'records', views.AttendanceRecordViewSet, basename='attendance-record')
router.register(r'overtime', views.OvertimeRequestViewSet, basename='overtime-request')

urlpatterns = [
    path('', include(router.urls)),
]
