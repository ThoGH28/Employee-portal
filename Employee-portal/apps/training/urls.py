from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.training import views

router = DefaultRouter()
router.register(r'programs', views.TrainingProgramViewSet, basename='training-program')
router.register(r'enrollments', views.TrainingEnrollmentViewSet, basename='training-enrollment')
router.register(r'certificates', views.CertificateViewSet, basename='certificate')

urlpatterns = [
    path('', include(router.urls)),
]
