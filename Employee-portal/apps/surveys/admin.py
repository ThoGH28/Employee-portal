from django.contrib import admin
from apps.surveys.models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer

@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'target_department', 'start_date', 'end_date', 'is_anonymous']
    list_filter = ['status', 'target_department', 'is_anonymous']
    search_fields = ['title']

@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ['survey', 'order', 'text', 'question_type', 'is_required']
    list_filter = ['question_type']

@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['survey', 'respondent', 'submitted_at']

@admin.register(SurveyAnswer)
class SurveyAnswerAdmin(admin.ModelAdmin):
    list_display = ['response', 'question']
