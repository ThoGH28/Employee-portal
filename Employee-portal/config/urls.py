"""
URL configuration for Employee Portal
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-token-auth/', obtain_auth_token),
    
    # API endpoints
    path('api/auth/', include('apps.users.urls')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/documents/', include('apps.documents.urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/search/', include('apps.search.urls')),
    path('api/automation/', include('apps.automation.urls')),
    path('api/attendance/', include('apps.attendance.urls')),
    path('api/performance/', include('apps.performance.urls')),
    path('api/training/', include('apps.training.urls')),
    path('api/assets/', include('apps.assets.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/surveys/', include('apps.surveys.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
