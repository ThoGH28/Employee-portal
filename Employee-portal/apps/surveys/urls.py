from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.surveys import views

router = DefaultRouter()
router.register(r'surveys', views.SurveyViewSet, basename='survey')
router.register(r'questions', views.SurveyQuestionViewSet, basename='survey-question')

urlpatterns = [
    path('', include(router.urls)),
]
