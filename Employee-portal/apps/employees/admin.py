from django.contrib import admin
from apps.employees.models import EmployeeProfile, LeaveRequest, HRAnnouncement, Payslip


@admin.register(EmployeeProfile)
class EmployeeProfileAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'department', 'designation', 'user']
    list_filter = ['department', 'date_of_joining']
    search_fields = ['employee_id', 'user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'leave_type', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'leave_type', 'start_date']
    search_fields = ['employee__username']
    readonly_fields = ['created_at', 'updated_at', 'approval_date']


@admin.register(HRAnnouncement)
class HRAnnouncementAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'published_at', 'expires_at']
    list_filter = ['status', 'published_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ['employee', 'month_year', 'gross_salary', 'net_salary', 'status']
    list_filter = ['status', 'month_year']
    search_fields = ['employee__username', 'employee__email']
    readonly_fields = ['gross_salary', 'total_deductions', 'net_salary', 'created_at', 'updated_at']
