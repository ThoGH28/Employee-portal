"""
Performance management: KPI goals + periodic reviews
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.users.models import CustomUser
import uuid


class KPIGoal(models.Model):
    PERIOD_CHOICES = (
        ('q1', 'Quý 1'),
        ('q2', 'Quý 2'),
        ('q3', 'Quý 3'),
        ('q4', 'Quý 4'),
        ('h1', '6 tháng đầu'),
        ('h2', '6 tháng cuối'),
        ('annual', 'Cả năm'),
    )
    STATUS_CHOICES = (
        ('active', 'Đang thực hiện'),
        ('completed', 'Hoàn thành'),
        ('cancelled', 'Đã hủy'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='kpi_goals')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_kpis')
    year = models.PositiveSmallIntegerField()
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_value = models.DecimalField(max_digits=10, decimal_places=2)
    actual_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, blank=True, help_text="Ví dụ: %, triệu VNĐ, đơn hàng")
    weight = models.PositiveSmallIntegerField(
        default=100,
        validators=[MinValueValidator(1), MaxValueValidator(100)],
        help_text="Trọng số (%)"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', 'period']
        indexes = [
            models.Index(fields=['employee', 'year', 'period']),
        ]

    @property
    def achievement_rate(self):
        if self.target_value:
            return round(float(self.actual_value) / float(self.target_value) * 100, 1)
        return 0

    def __str__(self):
        return f"{self.employee.username} - {self.title} ({self.year}/{self.period})"


class PerformanceReview(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Nháp'),
        ('submitted', 'Đã gửi'),
        ('acknowledged', 'Đã xác nhận'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='performance_reviews')
    reviewer = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='conducted_reviews')
    review_period = models.CharField(max_length=50, help_text="Ví dụ: Q1-2026, H1-2026")
    year = models.PositiveSmallIntegerField()

    # Scores (1-5)
    work_quality = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    work_efficiency = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    teamwork = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    initiative = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)], default=3
    )
    overall_score = models.DecimalField(max_digits=3, decimal_places=1, default=3.0)

    strengths = models.TextField(blank=True)
    areas_for_improvement = models.TextField(blank=True)
    goals_next_period = models.TextField(blank=True)
    reviewer_comments = models.TextField(blank=True)
    employee_comments = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-year', '-created_at']
        unique_together = ['employee', 'review_period', 'year']
        indexes = [
            models.Index(fields=['employee', 'year']),
        ]

    def save(self, *args, **kwargs):
        self.overall_score = round(
            (self.work_quality + self.work_efficiency + self.teamwork + self.initiative) / 4, 1
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Review: {self.employee.username} - {self.review_period} {self.year}"
