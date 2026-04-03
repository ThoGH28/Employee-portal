from django.contrib import admin
from apps.attendance.models import AttendanceRecord, OvertimeRequest

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'clock_in', 'clock_out', 'status', 'work_hours']
    list_filter = ['status', 'date']
    search_fields = ['employee__username', 'employee__first_name']

@admin.register(OvertimeRequest)
class OvertimeRequestAdmin(admin.ModelAdmin):
    list_display = ['employee', 'date', 'hours', 'status', 'approved_by']
    list_filter = ['status']
    search_fields = ['employee__username']
