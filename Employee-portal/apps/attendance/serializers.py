from rest_framework import serializers
from apps.attendance.models import AttendanceRecord, OvertimeRequest
from apps.users.serializers import UserSerializer


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    employee_id_no = serializers.CharField(source='employee.profile.employee_id', read_only=True, default='')

    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'employee', 'employee_name', 'employee_id_no',
            'date', 'clock_in', 'clock_out', 'status', 'work_hours', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'work_hours', 'created_at', 'updated_at']

    def validate(self, data):
        if data.get('clock_in') and data.get('clock_out'):
            if data['clock_out'] <= data['clock_in']:
                raise serializers.ValidationError("Giờ ra phải sau giờ vào.")
        return data


class AttendanceRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = ['date', 'clock_in', 'clock_out', 'status', 'notes']

    def validate(self, data):
        if data.get('clock_in') and data.get('clock_out'):
            if data['clock_out'] <= data['clock_in']:
                raise serializers.ValidationError("Giờ ra phải sau giờ vào.")
        return data


class OvertimeRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.get_full_name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OvertimeRequest
        fields = [
            'id', 'employee', 'employee_name',
            'date', 'start_time', 'end_time', 'hours',
            'reason', 'status', 'status_display',
            'approved_by', 'approved_by_name', 'approval_comment', 'approved_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'hours', 'approved_by', 'approval_comment', 'approved_at', 'created_at', 'updated_at']


class OvertimeApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['approved', 'rejected'])
    approval_comment = serializers.CharField(required=False, allow_blank=True)
