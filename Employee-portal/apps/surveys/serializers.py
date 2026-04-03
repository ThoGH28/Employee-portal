from rest_framework import serializers
from apps.surveys.models import Survey, SurveyQuestion, SurveyResponse, SurveyAnswer


class SurveyAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyAnswer
        fields = ['id', 'question', 'text_answer', 'rating_answer', 'choice_answers']
        read_only_fields = ['id']


class SurveyResponseSerializer(serializers.ModelSerializer):
    answers = SurveyAnswerSerializer(many=True)
    respondent_name = serializers.SerializerMethodField()

    class Meta:
        model = SurveyResponse
        fields = ['id', 'survey', 'respondent', 'respondent_name', 'answers', 'submitted_at']
        read_only_fields = ['id', 'submitted_at']

    def get_respondent_name(self, obj):
        if obj.respondent:
            return obj.respondent.get_full_name()
        return 'Ẩn danh'

    def create(self, validated_data):
        answers_data = validated_data.pop('answers')
        response = SurveyResponse.objects.create(**validated_data)
        for answer_data in answers_data:
            SurveyAnswer.objects.create(response=response, **answer_data)
        return response


class SurveyQuestionSerializer(serializers.ModelSerializer):
    question_type_display = serializers.CharField(source='get_question_type_display', read_only=True)

    class Meta:
        model = SurveyQuestion
        fields = ['id', 'survey', 'text', 'question_type', 'question_type_display', 'choices', 'order', 'is_required']
        read_only_fields = ['id']


class SurveySerializer(serializers.ModelSerializer):
    questions = SurveyQuestionSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    response_count = serializers.SerializerMethodField()

    class Meta:
        model = Survey
        fields = [
            'id', 'title', 'description', 'creator',
            'target_department', 'start_date', 'end_date',
            'is_anonymous', 'status', 'status_display',
            'questions', 'response_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_response_count(self, obj):
        return obj.responses.count()
