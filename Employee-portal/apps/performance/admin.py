from django.contrib import admin
from apps.performance.models import KPIGoal, PerformanceReview

@admin.register(KPIGoal)
class KPIGoalAdmin(admin.ModelAdmin):
    list_display = ['employee', 'title', 'year', 'period', 'target_value', 'actual_value', 'status']
    list_filter = ['year', 'period', 'status']
    search_fields = ['employee__username', 'title']

@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['employee', 'reviewer', 'review_period', 'year', 'overall_score', 'status']
    list_filter = ['year', 'status']
    search_fields = ['employee__username']
