from django.contrib import admin
from apps.training.models import TrainingProgram, TrainingEnrollment, Certificate

@admin.register(TrainingProgram)
class TrainingProgramAdmin(admin.ModelAdmin):
    list_display = ['title', 'instructor', 'start_date', 'end_date', 'status', 'max_participants']
    list_filter = ['status', 'target_department']
    search_fields = ['title', 'instructor']

@admin.register(TrainingEnrollment)
class TrainingEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['employee', 'program', 'status', 'completion_date', 'score']
    list_filter = ['status']
    search_fields = ['employee__username']

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'issuer', 'issue_date', 'expiry_date']
    search_fields = ['employee__username', 'title', 'issuer']
