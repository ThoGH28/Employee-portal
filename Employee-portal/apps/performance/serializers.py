from rest_framework import serializers
from apps.performance.models import KPIGoal, PerformanceReview


class KPIGoalSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    achievement_rate = serializers.FloatField(read_only=True)
    period_display = serializers.CharField(source='get_period_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = KPIGoal
        fields = [
            'id', 'employee', 'employee_name', 'created_by',
            'year', 'period', 'period_display',
            'title', 'description', 'target_value', 'actual_value',
            'unit', 'weight', 'achievement_rate',
            'status', 'status_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'achievement_rate']


class PerformanceReviewSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.get_full_name', read_only=True)
    reviewer_name = serializers.CharField(source='reviewer.get_full_name', read_only=True, default='')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PerformanceReview
        fields = [
            'id', 'employee', 'employee_name', 'reviewer', 'reviewer_name',
            'review_period', 'year',
            'work_quality', 'work_efficiency', 'teamwork', 'initiative', 'overall_score',
            'strengths', 'areas_for_improvement', 'goals_next_period',
            'reviewer_comments', 'employee_comments',
            'status', 'status_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'overall_score', 'created_at', 'updated_at']
