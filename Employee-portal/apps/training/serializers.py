from rest_framework import serializers
from apps.training.models import TrainingProgram, TrainingEnrollment, Certificate


class TrainingProgramSerializer(serializers.ModelSerializer):
    enrolled_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TrainingProgram
        fields = [
            'id', 'title', 'description', 'instructor', 'location',
            'target_department', 'start_date', 'end_date', 'max_participants',
            'enrolled_count', 'status', 'status_display',
            'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_enrolled_count(self, obj):
        return obj.enrollments.filter(status='enrolled').count()


class TrainingEnrollmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    program_title = serializers.CharField(source='program.title', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = TrainingEnrollment
        fields = [
            'id', 'employee', 'employee_name', 'program', 'program_title',
            'status', 'status_display', 'completion_date', 'score', 'feedback',
            'enrolled_at', 'updated_at',
        ]
        read_only_fields = ['id', 'enrolled_at', 'updated_at']


class CertificateSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)

    class Meta:
        model = Certificate
        fields = [
            'id', 'employee', 'employee_name',
            'title', 'issuer', 'issue_date', 'expiry_date',
            'certificate_file', 'description', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
