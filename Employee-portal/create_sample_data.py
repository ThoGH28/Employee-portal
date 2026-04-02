#!/usr/bin/env python
"""
Script to create sample data for the Employee Portal
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.employees.models import EmployeeProfile, HRAnnouncement, LeaveRequest
from django.utils import timezone

User = get_user_model()
admin_user = User.objects.get(username='admin')

# Create sample announcements
announcements_data = [
    {
        'title': 'Welcome to Employee Portal',
        'content': 'Welcome to our new Employee Portal. This is your one-stop destination for all HR-related information and services.',
        'created_by': admin_user,
        'status': 'published',
        'published_at': timezone.now(),
    },
    {
        'title': 'Holiday Schedule 2026',
        'content': 'The holiday schedule for 2026 has been posted. Please plan your leaves accordingly. Contact HR for any questions.',
        'created_by': admin_user,
        'status': 'published',
        'published_at': timezone.now(),
    },
    {
        'title': 'Team Building Event',
        'content': 'Mark your calendars! We are organizing a team building event on April 15th. More details coming soon.',
        'created_by': admin_user,
        'status': 'published',
        'published_at': timezone.now(),
    }
]

print("Creating sample announcements...")
for data in announcements_data:
    if not HRAnnouncement.objects.filter(title=data['title']).exists():
        HRAnnouncement.objects.create(**data)
        print(f"✓ Created announcement: {data['title']}")
    else:
        print(f"✗ Announcement '{data['title']}' already exists")

print("\nDone! Sample data created successfully.")
