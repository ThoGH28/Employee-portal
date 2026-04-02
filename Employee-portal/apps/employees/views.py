"""
Views for employee profile and leave management
"""
from django.db import models
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
import logging

from apps.employees.models import EmployeeProfile, LeaveRequest, HRAnnouncement, Payslip, AdministrativeRequest
from apps.employees.serializers import (
    EmployeeProfileSerializer,
    EmployeeProfileBasicSerializer,
    LeaveRequestSerializer,
    LeaveApprovalSerializer,
    HRAnnouncementSerializer,
    HRAnnouncementCreateSerializer,
    PayslipSerializer,
    PayslipCreateUpdateSerializer,
    OrgChartNodeSerializer,
    AdministrativeRequestSerializer,
    AdministrativeRequestProcessSerializer
)
from apps.users.permissions import get_department_filter

logger = logging.getLogger(__name__)


class EmployeeProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for employee profiles
    """
    queryset = EmployeeProfile.objects.all()
    serializer_class = EmployeeProfileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'employee_id', 'department']
    ordering_fields = ['user__first_name', 'date_of_joining', 'department']
    filterset_fields = ['department']
    
    def get_serializer_class(self):
        """Use basic serializer for cross-department viewing by regular employees"""
        if self.action == 'list':
            user = self.request.user
            if user.role not in ['admin', 'hr'] and not user.is_department_manager():
                return EmployeeProfileBasicSerializer
        return EmployeeProfileSerializer

    def get_queryset(self):
        """Filter based on user permissions with department scope"""
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return EmployeeProfile.objects.all()
        # Dept managers and employees see their department + basic cross-dept
        dept = user.get_department()
        if dept:
            return EmployeeProfile.objects.all()
        return EmployeeProfile.objects.filter(user=user)
    
    def update(self, request, *args, **kwargs):
        """Only allow updating own profile (or admin/hr for any)"""
        profile = self.get_object()
        if request.user.role not in ['admin', 'hr'] and profile.user != request.user:
            return Response({'detail': 'Bạn không có quyền chỉnh sửa hồ sơ này.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """Only allow updating own profile (or admin/hr for any)"""
        profile = self.get_object()
        if request.user.role not in ['admin', 'hr'] and profile.user != request.user:
            return Response({'detail': 'Bạn không có quyền chỉnh sửa hồ sơ này.'}, status=status.HTTP_403_FORBIDDEN)
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only admin can delete profiles"""
        if request.user.role != 'admin':
            return Response({'detail': 'Chỉ quản trị viên mới có thể xóa hồ sơ.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['patch'], url_path='admin-update')
    def admin_update(self, request, pk=None):
        """Admin/HR: update employee profile + user account fields"""
        if request.user.role not in ['admin', 'hr']:
            return Response({'detail': 'Chỉ admin/HR mới có quyền thực hiện.'}, status=status.HTTP_403_FORBIDDEN)

        profile = self.get_object()

        # Update User model fields
        user_fields = ['first_name', 'last_name', 'email', 'phone_number']
        user_updated = False
        for field in user_fields:
            if field in request.data:
                setattr(profile.user, field, request.data[field])
                user_updated = True
        # Allow role change only for admin
        if 'role' in request.data and request.user.role == 'admin':
            profile.user.role = request.data['role']
            user_updated = True
        if user_updated:
            profile.user.save()

        # Update profile fields
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data)

    @action(detail=False, methods=['get', 'patch'])
    def my_profile(self, request):
        """Get or update current user's profile"""
        try:
            profile = EmployeeProfile.objects.get(user=request.user)
        except EmployeeProfile.DoesNotExist:
            return Response(
                {'detail': 'Employee profile not found for this user.'},
                status=status.HTTP_404_NOT_FOUND
            )
        if request.method == 'PATCH':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        serializer = self.get_serializer(profile)
        return Response(serializer.data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for leave request management
    """
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'leave_type']
    ordering_fields = ['start_date', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter based on user role with department scope"""
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return LeaveRequest.objects.all()
        # Dept managers see their direct reports' leave requests + their own
        if user.is_department_manager():
            direct_report_users = [
                dr.user for dr in user.profile.direct_reports.all()
            ]
            return LeaveRequest.objects.filter(
                models.Q(employee=user) |
                models.Q(employee__in=direct_report_users)
            )
        # Employees see only their own leave requests
        return LeaveRequest.objects.filter(employee=user)
    
    def perform_create(self, serializer):
        """Create leave request for current user"""
        serializer.save(employee=self.request.user)
        logger.info(f"Leave request created by {self.request.user.username}")
    
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated],
        serializer_class=LeaveApprovalSerializer
    )
    def approve(self, request, pk=None):
        """Approve a leave request (HR/Admin/Dept Manager for direct reports)"""
        user = request.user
        if user.role not in ['admin', 'hr'] and not user.is_department_manager():
            return Response(
                {'detail': 'You do not have permission to approve leave requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        # Dept managers can only approve their direct reports' leaves
        leave_request = self.get_object()
        if user.role not in ['admin', 'hr']:
            direct_report_users = [dr.user for dr in user.profile.direct_reports.all()]
            if leave_request.employee not in direct_report_users:
                return Response(
                    {'detail': 'You can only approve leave requests from your direct reports'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        leave_request = self.get_object()
        serializer = LeaveApprovalSerializer(leave_request, data=request.data, partial=True)
        
        if serializer.is_valid():
            leave_request = serializer.save(approved_by=request.user, approval_date=timezone.now())
            logger.info(f"Leave request {leave_request.id} approved by {request.user.username}")
            return Response(LeaveRequestSerializer(leave_request).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel own leave request"""
        leave_request = self.get_object()
        
        if leave_request.employee != request.user:
            return Response(
                {'detail': 'You can only cancel your own leave requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if leave_request.status == 'approved' and leave_request.start_date <= timezone.now().date():
            return Response(
                {'detail': 'Cannot cancel approved leave that has already started'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave_request.status = 'cancelled'
        leave_request.save()
        logger.info(f"Leave request {leave_request.id} cancelled by {request.user.username}")
        
        return Response(LeaveRequestSerializer(leave_request).data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def balance(self, request):
        """Get leave balance for current user"""
        user = request.user
        # Calculate total, used, and remaining leave
        approved_leaves = LeaveRequest.objects.filter(
            employee=user,
            status='approved'
        ).exclude(start_date__gt=timezone.now().date())
        
        # Calculate days used (for approved leaves)
        used = sum(
            (leave.end_date - leave.start_date).days + 1
            for leave in approved_leaves
        )
        
        # Total leave days per year (assumed 20)
        total = 20
        remaining = max(0, total - used)
        
        # Count pending leaves
        pending = LeaveRequest.objects.filter(
            employee=user,
            status='pending'
        ).count()
        
        return Response({
            'total': total,
            'used': used,
            'remaining': remaining,
            'pending': pending,
        })


class HRAnnouncementViewSet(viewsets.ModelViewSet):
    """
    API endpoint for HR announcements
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'content']
    ordering_fields = ['published_at', 'created_at']
    ordering = ['-published_at']
    
    def get_queryset(self):
        """Filter based on user role with department scope"""
        user = self.request.user
        today = timezone.now().date()
        
        if user.role in ['admin', 'hr']:
            return HRAnnouncement.objects.all()
        
        # Employees see published, non-expired, targeted to their dept or all
        dept = user.get_department()
        qs = HRAnnouncement.objects.filter(
            status='published'
        ).filter(
            models.Q(expires_at__isnull=True) | models.Q(expires_at__gte=today)
        )
        if dept:
            qs = qs.filter(
                models.Q(target_department='all') | models.Q(target_department=dept)
            )
        return qs
    
    def get_serializer_class(self):
        """Use different serializer for create"""
        if self.action == 'create':
            return HRAnnouncementCreateSerializer
        return HRAnnouncementSerializer
    
    def perform_create(self, serializer):
        """Create announcement"""
        if self.request.user.role not in ['admin', 'hr']:
            raise serializers.ValidationError('Only HR and admin can create announcements')
        serializer.save()
        logger.info(f"Announcement created by {self.request.user.username}")
    
    def perform_update(self, serializer):
        """Update announcement"""
        if self.request.user.role not in ['admin', 'hr']:
            raise serializers.ValidationError('Only HR and admin can update announcements')
        serializer.save()
        logger.info(f"Announcement updated by {self.request.user.username}")
    
    def perform_destroy(self, instance):
        """Delete announcement (soft delete via archive)"""
        if self.request.user.role not in ['admin', 'hr']:
            raise serializers.ValidationError('Only HR and admin can delete announcements')
        instance.status = 'archived'
        instance.save()
        logger.info(f"Announcement archived by {self.request.user.username}")
    
    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get all published announcements"""
        announcements = self.get_queryset().filter(status='published')
        serializer = self.get_serializer(announcements, many=True)
        return Response(serializer.data)


class PayslipViewSet(viewsets.ModelViewSet):
    """
    API endpoint for payslip management
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'month_year']
    ordering_fields = ['month_year', 'created_at']
    ordering = ['-month_year']
    
    def get_queryset(self):
        """Filter based on user role"""
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return Payslip.objects.all()
        # Employees can only view their own payslips
        return Payslip.objects.filter(employee=user)
    
    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return PayslipCreateUpdateSerializer
        return PayslipSerializer
    
    def perform_create(self, serializer):
        """Only HR/Admin can create payslips"""
        if self.request.user.role not in ['admin', 'hr']:
            raise serializers.ValidationError('Only HR and admin can create payslips')
        serializer.save()
        logger.info(f"Payslip created by {self.request.user.username}")
    
    def perform_update(self, serializer):
        """Only HR/Admin can update payslips"""
        if self.request.user.role not in ['admin', 'hr']:
            raise serializers.ValidationError('Only HR and admin can update payslips')
        serializer.save()
        logger.info(f"Payslip updated by {self.request.user.username}")
    
    def perform_destroy(self, instance):
        """Only HR/Admin can delete payslips"""
        if self.request.user.role not in ['admin', 'hr']:
            raise serializers.ValidationError('Only HR and admin can delete payslips')
        instance.delete()
        logger.info(f"Payslip deleted by {self.request.user.username}")
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_payslips(self, request):
        """Get current user's payslips"""
        payslips = Payslip.objects.filter(employee=request.user)
        serializer = self.get_serializer(payslips, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download payslip PDF"""
        payslip = self.get_object()
        
        # Check permission
        if payslip.employee != request.user and request.user.role not in ['admin', 'hr']:
            return Response(
                {'detail': 'You do not have permission to download this payslip'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if payslip.pdf_file:
            return Response({
                'pdf_url': payslip.pdf_file.url,
                'month_year': payslip.month_year.strftime('%B %Y')
            })
        
        return Response(
            {'detail': 'PDF file not available yet'},
            status=status.HTTP_404_NOT_FOUND
        )


class OrgChartViewSet(viewsets.ViewSet):
    """
    API endpoint for organization chart
    """
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """Get org chart tree, scoped by department for non-admin users"""
        user = request.user
        department = request.query_params.get('department', None)
        queryset = EmployeeProfile.objects.filter(manager__isnull=True)

        if user.role in ['admin', 'hr']:
            # Admin/HR can view all or filter by department
            if department:
                queryset = queryset.filter(department=department)
        else:
            # Regular employees and dept managers only see their department
            dept = user.get_department()
            if dept:
                queryset = EmployeeProfile.objects.filter(department=dept, manager__isnull=True)
            else:
                queryset = EmployeeProfile.objects.none()

        serializer = OrgChartNodeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def departments(self, request):
        """Get list of departments with employee counts"""
        departments = (
            EmployeeProfile.objects
            .values('department')
            .annotate(count=models.Count('id'))
            .order_by('department')
        )
        return Response(list(departments))

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get org chart grouped by department"""
        department = request.query_params.get('department', None)
        if not department:
            return Response(
                {'detail': 'department query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        profiles = EmployeeProfile.objects.filter(
            department=department, manager__isnull=True
        )
        serializer = OrgChartNodeSerializer(profiles, many=True)
        return Response(serializer.data)


class AdministrativeRequestViewSet(viewsets.ModelViewSet):
    """
    API endpoint for administrative requests
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'request_type', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'updated_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter based on user role with department scope"""
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return AdministrativeRequest.objects.all()
        # Dept managers see their department's requests
        if user.is_department_manager():
            dept = user.get_department()
            if dept:
                return AdministrativeRequest.objects.filter(
                    models.Q(employee=user) |
                    models.Q(employee__profile__department=dept)
                )
        return AdministrativeRequest.objects.filter(employee=user)

    def get_serializer_class(self):
        if self.action == 'process':
            return AdministrativeRequestProcessSerializer
        return AdministrativeRequestSerializer

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)
        logger.info(f"Administrative request created by {self.request.user.username}")

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """Get current user's administrative requests"""
        requests = AdministrativeRequest.objects.filter(employee=request.user)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def process(self, request, pk=None):
        """Process (approve/reject/complete) an administrative request (HR/Admin only)"""
        if request.user.role not in ['admin', 'hr']:
            return Response(
                {'detail': 'You do not have permission to process requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        admin_request = self.get_object()
        serializer = AdministrativeRequestProcessSerializer(
            admin_request, data=request.data, partial=True
        )
        if serializer.is_valid():
            instance = serializer.save(processed_by=request.user)
            if instance.status == 'completed':
                instance.completed_at = timezone.now()
                instance.save()
            logger.info(f"Administrative request {instance.id} processed by {request.user.username}")
            return Response(AdministrativeRequestSerializer(instance).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel own administrative request"""
        admin_request = self.get_object()
        if admin_request.employee != request.user:
            return Response(
                {'detail': 'You can only cancel your own requests'},
                status=status.HTTP_403_FORBIDDEN
            )
        if admin_request.status in ['completed', 'rejected']:
            return Response(
                {'detail': 'Cannot cancel a completed or rejected request'},
                status=status.HTTP_400_BAD_REQUEST
            )
        admin_request.status = 'pending'
        admin_request.save()
        return Response(AdministrativeRequestSerializer(admin_request).data)
