from django.contrib import admin
from apps.attendance.models import AttendanceRecord, OvertimeRequest, LatePardon

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'clock_in', 'clock_out', 'status', 'work_hours', 'late_minutes', 'penalty_amount']
    list_filter = ['status', 'date']
    search_fields = ['employee__username', 'employee__first_name']

@admin.register(OvertimeRequest)
class OvertimeRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'hours', 'status', 'approved_by']
    list_filter = ['status']
    search_fields = ['employee__username']

@admin.register(LatePardon)
class LatePardonAdmin(admin.ModelAdmin):
    list_display = ['attendance_record', 'status', 'approved_by', 'approved_at']
    list_filter = ['status']
    search_fields = ['attendance_record__employee__username']
