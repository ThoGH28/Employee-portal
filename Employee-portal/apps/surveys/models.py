"""
Survey / internal poll models
"""
from django.db import models
from apps.users.models import CustomUser
from apps.employees.models import EmployeeProfile
import uuid


class Survey(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Nháp'),
        ('active', 'Đang mở'),
        ('closed', 'Đã đóng'),
    )
    DEPARTMENT_CHOICES = EmployeeProfile.DEPARTMENT_CHOICES + (('all', 'Tất cả'),)

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    creator = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='created_surveys')
    target_department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, default='all')
    start_date = models.DateField()
    end_date = models.DateField()
    is_anonymous = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class SurveyQuestion(models.Model):
    QUESTION_TYPE_CHOICES = (
        ('text', 'Văn bản tự do'),
        ('rating', 'Đánh giá (1-5)'),
        ('single_choice', 'Chọn một'),
        ('multi_choice', 'Chọn nhiều'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='text')
    choices = models.JSONField(default=list, blank=True, help_text="List of choice strings for choice questions")
    order = models.PositiveSmallIntegerField(default=0)
    is_required = models.BooleanField(default=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"[{self.survey.title}] Q{self.order}: {self.text[:50]}"


class SurveyResponse(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='responses')
    respondent = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='survey_responses'
    )
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        name = self.respondent.username if self.respondent else 'Anonymous'
        return f"{self.survey.title} - {name}"


class SurveyAnswer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name='answers')
    text_answer = models.TextField(blank=True)
    rating_answer = models.PositiveSmallIntegerField(blank=True, null=True)
    choice_answers = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ['response', 'question']

    def __str__(self):
        return f"Answer to Q{self.question.order} in {self.response}"
