"""
Serializers for employee profile and leave management
"""
from rest_framework import serializers
from django.utils import timezone
from apps.employees.models import EmployeeProfile, LeaveRequest, HRAnnouncement, Payslip, AdministrativeRequest
from apps.users.serializers import UserSerializer


class EmployeeProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for EmployeeProfile model (full detail)
    """
    user = UserSerializer(read_only=True)
    manager_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'user', 'department', 'designation', 'employee_id',
            'date_of_joining', 'date_of_birth', 'address', 'city', 'state',
            'country', 'postal_code', 'emergency_contact', 'emergency_contact_phone',
            'bank_name', 'bank_account_number', 'bank_branch',
            'manager', 'manager_name',
            'profile_image', 'bio', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_manager_name(self, obj):
        if obj.manager:
            return obj.manager.user.get_full_name()
        return None


class EmployeeProfileBasicSerializer(serializers.ModelSerializer):
    """
    Basic serializer for cross-department viewing.
    Only exposes name, email, department, designation - no sensitive info.
    """
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = EmployeeProfile
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'department', 'designation', 'profile_image',
        ]
        read_only_fields = fields


class LeaveRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for LeaveRequest model
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, allow_null=True)
    days_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type', 'start_date',
            'end_date', 'reason', 'status', 'approved_by', 'approved_by_name',
            'approval_date', 'approval_comment', 'days_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'employee', 'approved_by', 'approved_by_name', 'approval_date', 'created_at', 'updated_at']
    
    def get_days_count(self, obj):
        """Calculate number of leave days"""
        delta = obj.end_date - obj.start_date
        return delta.days + 1
    
    def validate(self, attrs):
        """Validate leave request"""
        # Check if start_date is before end_date
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] > attrs['end_date']:
                raise serializers.ValidationError("Start date must be before end date")
            
            if attrs['start_date'] < timezone.now().date():
                raise serializers.ValidationError("Start date cannot be in the past")
        
        return attrs


class LeaveApprovalSerializer(serializers.ModelSerializer):
    """
    Serializer for approving/rejecting leave requests
    """
    class Meta:
        model = LeaveRequest
        fields = ['id', 'status', 'approval_comment']
        read_only_fields = ['id']
    
    def validate_status(self, value):
        """Validate status change"""
        if value not in ['approved', 'rejected']:
            raise serializers.ValidationError("Status must be 'approved' or 'rejected'")
        return value


class HRAnnouncementSerializer(serializers.ModelSerializer):
    """
    Serializer for HRAnnouncement model
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = HRAnnouncement
        fields = [
            'id', 'title', 'content', 'status', 'target_department',
            'created_by', 'created_by_name',
            'created_at', 'updated_at', 'published_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']


class HRAnnouncementCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating HR announcements
    """
    class Meta:
        model = HRAnnouncement
        fields = ['title', 'content', 'status', 'target_department', 'expires_at']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        if validated_data.get('status') == 'published':
            validated_data['published_at'] = timezone.now()
        return super().create(validated_data)


class PayslipSerializer(serializers.ModelSerializer):
    """
    Serializer for Payslip model
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    month_year_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Payslip
        fields = [
            'id', 'employee', 'employee_name', 'month_year', 'month_year_display',
            'basic_salary', 'house_rent_allowance', 'dearness_allowance', 'other_allowances',
            'provident_fund', 'tax_deducted_at_source', 'insurance', 'other_deductions',
            'gross_salary', 'total_deductions', 'net_salary',
            'status', 'pdf_file', 'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'gross_salary', 'total_deductions', 'net_salary',
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
    
    def get_month_year_display(self, obj):
        """Format month and year for display"""
        return obj.month_year.strftime('%B %Y')


class PayslipCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating payslips (HR only)
    """
    class Meta:
        model = Payslip
        fields = [
            'employee', 'month_year',
            'basic_salary', 'house_rent_allowance', 'dearness_allowance', 'other_allowances',
            'provident_fund', 'tax_deducted_at_source', 'insurance', 'other_deductions',
            'status', 'pdf_file'
        ]
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class OrgChartNodeSerializer(serializers.ModelSerializer):
    """
    Serializer for organization chart nodes
    """
    user = UserSerializer(read_only=True)
    children = serializers.SerializerMethodField()

    class Meta:
        model = EmployeeProfile
        fields = ['id', 'user', 'department', 'designation', 'employee_id', 'profile_image', 'children']

    def get_children(self, obj):
        children = obj.direct_reports.all()
        return OrgChartNodeSerializer(children, many=True).data


class AdministrativeRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for AdministrativeRequest model
    """
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True, allow_null=True)
    request_type_display = serializers.CharField(source='get_request_type_display', read_only=True)

    class Meta:
        model = AdministrativeRequest
        fields = [
            'id', 'employee', 'employee_name', 'request_type', 'request_type_display',
            'title', 'description', 'priority', 'status',
            'processed_by', 'processed_by_name', 'admin_comment',
            'attachment', 'created_at', 'updated_at', 'completed_at'
        ]
        read_only_fields = ['id', 'employee', 'processed_by', 'created_at', 'updated_at', 'completed_at']


class AdministrativeRequestProcessSerializer(serializers.ModelSerializer):
    """
    Serializer for processing (approve/reject) administrative requests
    """
    class Meta:
        model = AdministrativeRequest
        fields = ['id', 'status', 'admin_comment']
        read_only_fields = ['id']

    def validate_status(self, value):
        if value not in ['in_progress', 'approved', 'rejected', 'completed']:
            raise serializers.ValidationError("Invalid status transition")
        return value
