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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
