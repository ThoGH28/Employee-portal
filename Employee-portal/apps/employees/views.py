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

from apps.employees.models import EmployeeProfile, LeaveRequest, HRAnnouncement, Payslip, AdministrativeRequest, WFHRequest, Contract, PublicHoliday
from apps.employees.serializers import (
    EmployeeProfileSerializer,
    EmployeeProfileBasicSerializer,
    CreateEmployeeSerializer,
    LeaveRequestSerializer,
    LeaveApprovalSerializer,
    HRAnnouncementSerializer,
    HRAnnouncementCreateSerializer,
    PayslipSerializer,
    PayslipCreateUpdateSerializer,
    OrgChartNodeSerializer,
    AdministrativeRequestSerializer,
    AdministrativeRequestProcessSerializer,
    WFHRequestSerializer,
    WFHApprovalSerializer,
    ContractSerializer,
    PublicHolidaySerializer,
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

    @action(detail=False, methods=['post'], url_path='create_employee')
    def create_employee(self, request):
        """Admin/HR: create a new user account + employee profile in one step."""
        if request.user.role not in ['admin', 'hr']:
            return Response({'detail': 'Chỉ admin/HR mới có quyền thực hiện.'}, status=status.HTTP_403_FORBIDDEN)
        serializer = CreateEmployeeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        return Response(EmployeeProfileSerializer(profile).data, status=status.HTTP_201_CREATED)

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
        # Calculate total, used, and remaining leave (count all approved leaves,
        # including future ones, so balance reflects reservations immediately)
        approved_leaves = LeaveRequest.objects.filter(
            employee=user,
            status='approved'
        )
        
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

    @action(detail=True, methods=['get'], url_path='generate-pdf')
    def generate_pdf(self, request, pk=None):
        """Generate and return a PDF payslip on the fly using reportlab."""
        payslip = self.get_object()

        if payslip.employee != request.user and request.user.role not in ['admin', 'hr']:
            return Response(
                {'detail': 'Không có quyền xem phiếu lương này.'},
                status=status.HTTP_403_FORBIDDEN
            )

        import io, os
        from django.http import HttpResponse
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont

        # ── Register a Unicode/Vietnamese-capable font ──────────────────
        # Try common system font locations (Windows → Linux/Docker)
        _font_candidates = [
            (r'C:\Windows\Fonts\arial.ttf',    r'C:\Windows\Fonts\arialbd.ttf'),
            (r'C:\Windows\Fonts\calibri.ttf',  r'C:\Windows\Fonts\calibrib.ttf'),
            ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
             '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'),
            ('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
             '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'),
            ('/usr/share/fonts/truetype/freefont/FreeSans.ttf',
             '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf'),
        ]
        FONT_REG  = 'VietFont'
        FONT_BOLD = 'VietFont-Bold'
        _registered = FONT_REG in pdfmetrics.getRegisteredFontNames()
        if not _registered:
            for reg_path, bold_path in _font_candidates:
                if os.path.exists(reg_path) and os.path.exists(bold_path):
                    pdfmetrics.registerFont(TTFont(FONT_REG,  reg_path))
                    pdfmetrics.registerFont(TTFont(FONT_BOLD, bold_path))
                    _registered = True
                    break
        if not _registered:
            # Last-resort: use reportlab's built-in CID font for basic Latin
            FONT_REG = FONT_BOLD = 'Helvetica'

        # ── Helpers ─────────────────────────────────────────────────────
        fmt_vnd = lambda v: f"{int(v):,} VND".replace(',', '.')

        def P(text, style):
            """Shorthand – return a Paragraph, escaping & for XML safety."""
            return Paragraph(str(text).replace('&', '&amp;'), style)

        emp = payslip.employee
        profile = getattr(emp, 'profile', None)
        dept = getattr(profile, 'department', '—') if profile else '—'
        pos  = getattr(profile, 'position', '—') if profile else '—'
        month_label = payslip.month_year.strftime('%m/%Y')

        # ── Document & base styles ───────────────────────────────────────
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf, pagesize=A4,
            leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm
        )
        base = getSampleStyleSheet()

        def style(name, **kw):
            kw.setdefault('fontName', FONT_REG)
            kw.setdefault('fontSize', 10)
            return ParagraphStyle(name, parent=base['Normal'], **kw)

        s_title   = style('ps_title',   fontName=FONT_BOLD, fontSize=18, alignment=TA_CENTER, spaceAfter=4)
        s_sub     = style('ps_sub',     fontSize=10, alignment=TA_CENTER, spaceAfter=2)
        s_label   = style('ps_label',   fontName=FONT_BOLD, fontSize=9,  textColor=colors.HexColor('#555555'))
        s_value   = style('ps_value',   fontSize=9)
        s_section = style('ps_section', fontName=FONT_BOLD, fontSize=11,
                          textColor=colors.HexColor('#1a3c5e'), spaceBefore=10, spaceAfter=4)
        s_row     = style('ps_row',     fontSize=9)
        s_row_r   = style('ps_row_r',   fontSize=9, alignment=TA_RIGHT)
        s_total   = style('ps_total',   fontName=FONT_BOLD, fontSize=9)
        s_total_r = style('ps_total_r', fontName=FONT_BOLD, fontSize=9, alignment=TA_RIGHT)
        s_net_l   = style('ps_net_l',   fontName=FONT_BOLD, fontSize=13,
                          textColor=colors.white)
        s_net_r   = style('ps_net_r',   fontName=FONT_BOLD, fontSize=13,
                          textColor=colors.white, alignment=TA_RIGHT)
        s_footer  = style('ps_footer',  fontSize=8, textColor=colors.gray, alignment=TA_CENTER)

        elements = []

        # ── Header ──────────────────────────────────────────────────────
        elements.append(P("PHIẾU LƯƠNG", s_title))
        elements.append(P(f"Tháng {month_label}", s_sub))
        elements.append(Spacer(1, 0.3*cm))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#1a3c5e')))
        elements.append(Spacer(1, 0.4*cm))

        # ── Employee info ────────────────────────────────────────────────
        info_data = [
            [P("Họ và tên:",        s_label), P(emp.get_full_name() or emp.username, s_value),
             P("Mã NV:",            s_label), P(getattr(profile, 'employee_id', '—') if profile else '—', s_value)],
            [P("Phòng ban:",        s_label), P(dept, s_value),
             P("Chức vụ:",          s_label), P(pos,  s_value)],
            [P("Email:",            s_label), P(emp.email, s_value),
             P("Trạng thái phiếu:", s_label), P(payslip.get_status_display(), s_value)],
        ]
        info_table = Table(info_data, colWidths=[3*cm, 7*cm, 3.2*cm, 3.8*cm])
        info_table.setStyle(TableStyle([
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING',    (0,0), (-1,-1), 4),
            ('VALIGN',        (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.5*cm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#dddddd')))

        # ── Earnings & Deductions ────────────────────────────────────────
        elements.append(Spacer(1, 0.4*cm))

        earn_data = [
            [P("THU NHẬP", s_section), ""],
            [P("Lương cơ bản:",          s_row), P(fmt_vnd(payslip.basic_salary),          s_row_r)],
            [P("Phụ cấp nhà ở (HRA):",   s_row), P(fmt_vnd(payslip.house_rent_allowance),   s_row_r)],
            [P("Phụ cấp đắt đỏ (DA):",   s_row), P(fmt_vnd(payslip.dearness_allowance),     s_row_r)],
            [P("Phụ cấp khác:",           s_row), P(fmt_vnd(payslip.other_allowances),       s_row_r)],
            [P("Tổng thu nhập",          s_total), P(fmt_vnd(payslip.gross_salary),          s_total_r)],
        ]
        ded_data = [
            [P("KHẤU TRỪ", s_section), ""],
            [P("Quỹ hưu trí (PF):",      s_row), P(fmt_vnd(payslip.provident_fund),         s_row_r)],
            [P("Thuế TNCN:",             s_row), P(fmt_vnd(payslip.tax_deducted_at_source),  s_row_r)],
            [P("Bảo hiểm:",              s_row), P(fmt_vnd(payslip.insurance),               s_row_r)],
            [P("Khấu trừ khác:",         s_row), P(fmt_vnd(payslip.other_deductions),        s_row_r)],
            [P("Tổng khấu trừ",         s_total), P(fmt_vnd(payslip.total_deductions),       s_total_r)],
        ]

        def make_section_table(data):
            t = Table(data, colWidths=[5.5*cm, 3.5*cm])
            t.setStyle(TableStyle([
                ('FONTSIZE',      (0,0), (-1,-1), 9),
                ('ALIGN',         (1,0), (1,-1), 'RIGHT'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('TOPPADDING',    (0,0), (-1,-1), 4),
                ('LINEBELOW',     (0,-1), (-1,-1), 0.8, colors.HexColor('#1a3c5e')),
                ('BACKGROUND',    (0,-1), (-1,-1), colors.HexColor('#f0f4f8')),
                ('SPAN',          (0,0), (1,0)),
                ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
            ]))
            return t

        two_col = Table(
            [[make_section_table(earn_data), make_section_table(ded_data)]],
            colWidths=[9.5*cm, 9.5*cm]
        )
        two_col.setStyle(TableStyle([
            ('VALIGN',       (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING',  (1,0), (1,0), 12),
        ]))
        elements.append(two_col)

        # ── Net salary hero ──────────────────────────────────────────────
        elements.append(Spacer(1, 0.6*cm))
        net_table = Table(
            [[P("LƯƠNG THỰC NHẬN", s_net_l), P(fmt_vnd(payslip.net_salary), s_net_r)]],
            colWidths=[13*cm, 6*cm]
        )
        net_table.setStyle(TableStyle([
            ('BACKGROUND',    (0,0), (-1,-1), colors.HexColor('#1a3c5e')),
            ('TOPPADDING',    (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING',   (0,0), (0,-1), 14),
            ('RIGHTPADDING',  (1,0), (1,-1), 14),
            ('VALIGN',        (0,0), (-1,-1), 'MIDDLE'),
        ]))
        elements.append(net_table)

        # ── Footer ───────────────────────────────────────────────────────
        elements.append(Spacer(1, 1*cm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#dddddd')))
        elements.append(Spacer(1, 0.3*cm))
        elements.append(P(
            f"Phiếu lương được tạo tự động • {month_label} • Confidential",
            s_footer
        ))

        doc.build(elements)
        buf.seek(0)

        filename = f"Phieu_luong_{emp.username}_{month_label.replace('/', '_')}.pdf"
        response = HttpResponse(buf, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        response['Access-Control-Expose-Headers'] = 'Content-Disposition'
        return response


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


class WFHRequestViewSet(viewsets.ModelViewSet):
    queryset = WFHRequest.objects.select_related('employee', 'approved_by')
    serializer_class = WFHRequestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'employee']
    ordering_fields = ['start_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return WFHRequest.objects.select_related('employee', 'approved_by').all()
        if user.is_department_manager():
            dept = user.get_department()
            return WFHRequest.objects.select_related('employee', 'approved_by').filter(
                employee__profile__department=dept
            )
        return WFHRequest.objects.filter(employee=user)

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        user = request.user
        if not (user.role in ['admin', 'hr'] or user.is_department_manager()):
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        wfh = self.get_object()
        if wfh.status != 'pending':
            return Response({'detail': 'Chỉ duyệt được đơn đang chờ.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = WFHApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        wfh.status = serializer.validated_data['status']
        wfh.approval_comment = serializer.validated_data.get('approval_comment', '')
        wfh.approved_by = user
        wfh.approved_at = timezone.now()
        wfh.save()
        return Response(WFHRequestSerializer(wfh).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        wfh = self.get_object()
        if wfh.employee != request.user:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        if wfh.status not in ['pending']:
            return Response({'detail': 'Chỉ có thể hủy đơn đang chờ.'}, status=status.HTTP_400_BAD_REQUEST)
        wfh.status = 'cancelled'
        wfh.save()
        return Response(WFHRequestSerializer(wfh).data)


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.select_related('employee', 'created_by')
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'contract_type', 'employee']
    search_fields = ['contract_number']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'hr']:
            return Contract.objects.select_related('employee', 'created_by').all()
        return Contract.objects.filter(employee=user)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'hr']:
            from rest_framework import exceptions
            raise exceptions.PermissionDenied('Chỉ Admin/HR mới có thể tạo hợp đồng.')
        serializer.save(created_by=self.request.user)


class PublicHolidayViewSet(viewsets.ModelViewSet):
    queryset = PublicHoliday.objects.all()
    serializer_class = PublicHolidaySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_paid']
    ordering_fields = ['date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            from apps.users.permissions import IsAdminOrHR
            return [IsAdminOrHR()]
        return [IsAuthenticated()]
