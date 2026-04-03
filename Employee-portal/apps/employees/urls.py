"""
URLs for employee profile and leave management
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.employees import views

router = DefaultRouter()
router.register(r'profiles', views.EmployeeProfileViewSet, basename='employee-profile')
router.register(r'leave', views.LeaveRequestViewSet, basename='leave-request')
router.register(r'announcements', views.HRAnnouncementViewSet, basename='announcement')
router.register(r'payslips', views.PayslipViewSet, basename='payslip')
router.register(r'org-chart', views.OrgChartViewSet, basename='org-chart')
router.register(r'admin-requests', views.AdministrativeRequestViewSet, basename='admin-request')
router.register(r'wfh', views.WFHRequestViewSet, basename='wfh-request')
router.register(r'contracts', views.ContractViewSet, basename='contract')
router.register(r'holidays', views.PublicHolidayViewSet, basename='public-holiday')

urlpatterns = [
    path('', include(router.urls)),
]
