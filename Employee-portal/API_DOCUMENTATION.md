# Employee Portal API Documentation

## Overview

Complete API documentation for the Employee Portal backend. All endpoints require JWT authentication unless otherwise noted.

## Authentication

### Obtain JWT Tokens

**POST** `/api/auth/login/`

Request body:
```json
{
    "username": "john_doe",
    "password": "SecurePassword123!"
}
```

Response (200 OK):
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "john_doe",
        "email": "john@example.com",
        "role": "employee",
        "first_name": "John",
        "last_name": "Doe"
    }
}
```

### Refresh Access Token

**POST** `/api/auth/refresh/`

Request body:
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

Response (200 OK):
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

## User Endpoints

### Register

**POST** `/api/auth/register/`

Request body:
```json
{
    "username": "new_user",
    "email": "new@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "first_name": "First",
    "last_name": "Last",
    "phone_number": "+1234567890"
}
```

Response (201 Created):
```json
{
    "message": "User registered successfully",
    "user": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "new_user",
        "email": "new@example.com",
        "role": "employee"
    }
}
```

### Get Profile

**GET** `/api/auth/profile/`

Response (200 OK):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "employee",
    "phone_number": "+1234567890",
    "is_active": true,
    "created_at": "2024-03-30T10:00:00Z"
}
```

### Update Profile

**PUT/PATCH** `/api/auth/profile/update/`

Request body:
```json
{
    "first_name": "John",
    "last_name": "Smith",
    "phone_number": "+9876543210"
}
```

Response (200 OK): Updated user object

### Change Password

**POST** `/api/auth/change-password/`

Request body:
```json
{
    "old_password": "OldPassword123!",
    "new_password": "NewPassword123!",
    "new_password_confirm": "NewPassword123!"
}
```

Response (200 OK):
```json
{
    "message": "Password changed successfully"
}
```

## Employee Endpoints

### List Employee Profiles

**GET** `/api/employees/profiles/`

Query parameters:
- `page` (integer) - Page number
- `search` (string) - Search by name or employee ID
- `department` (string) - Filter by department
- `ordering` (string) - Order by field

Response (200 OK):
```json
{
    "count": 50,
    "next": "http://localhost:8000/api/employees/profiles/?page=2",
    "previous": null,
    "results": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "user": {...},
            "department": "it",
            "designation": "Software Engineer",
            "employee_id": "EMP-001",
            "date_of_joining": "2023-01-15",
            "date_of_birth": "1995-05-20",
            "address": "123 Main St",
            "city": "New York",
            "state": "NY",
            "country": "USA",
            "postal_code": "10001",
            "emergency_contact": "Jane Doe",
            "emergency_contact_phone": "+1234567890",
            "bio": "Experienced full-stack developer"
        }
    ]
}
```

### Get My Profile

**GET** `/api/employees/profiles/my_profile/`

Response (200 OK): Employee profile object

### Leave Requests

#### List Leave Requests

**GET** `/api/employees/leave/`

Query parameters:
- `status` (string) - Filter by status (pending, approved, rejected)
- `leave_type` (string) - Filter by leave type
- `page` (integer) - Page number

Response (200 OK):
```json
{
    "count": 10,
    "results": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "employee": "550e8400-e29b-41d4-a716-446655440001",
            "employee_name": "John Doe",
            "leave_type": "casual",
            "start_date": "2024-04-15",
            "end_date": "2024-04-17",
            "reason": "Vacation",
            "status": "pending",
            "approved_by": null,
            "approval_date": null,
            "approval_comment": null,
            "days_count": 3,
            "created_at": "2024-03-30T10:00:00Z"
        }
    ]
}
```

#### Create Leave Request

**POST** `/api/employees/leave/`

Request body:
```json
{
    "leave_type": "casual",
    "start_date": "2024-04-15",
    "end_date": "2024-04-17",
    "reason": "Vacation"
}
```

Response (201 Created): Leave request object

#### Approve Leave Request (HR/Admin)

**POST** `/api/employees/leave/{id}/approve/`

Request body:
```json
{
    "status": "approved",
    "approval_comment": "Approved"
}
```

Response (200 OK): Updated leave request

#### Cancel Leave Request

**POST** `/api/employees/leave/{id}/cancel/`

Response (200 OK): Updated leave request with status "cancelled"

### Announcements

#### List Announcements

**GET** `/api/employees/announcements/`

Query parameters:
- `status` (string) - Filter by status
- `page` (integer) - Page number

Response (200 OK): List of announcements

#### Create Announcement (HR/Admin)

**POST** `/api/employees/announcements/`

Request body:
```json
{
    "title": "New Remote Work Policy",
    "content": "Starting from April, all employees...",
    "status": "published",
    "expires_at": "2024-12-31T23:59:59Z"
}
```

Response (201 Created): Announcement object

## Document Endpoints

### List Documents

**GET** `/api/documents/`

Query parameters:
- `document_type` (string) - policy, announcement, handbook, form, other
- `status` (string) - uploaded, processing, indexed, failed
- `is_indexed` (boolean) - Filter indexed documents
- `search` (string) - Search title/description
- `page` (integer) - Page number

Response (200 OK):
```json
{
    "count": 25,
    "results": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Employee Handbook 2024",
            "description": "Comprehensive guide...",
            "document_type": "handbook",
            "file": "/media/documents/2024/03/handbook.pdf",
            "file_size": 2048000,
            "file_type": "pdf",
            "uploaded_by": "550e8400-e29b-41d4-a716-446655440001",
            "uploaded_by_name": "Admin User",
            "status": "indexed",
            "is_indexed": true,
            "created_at": "2024-03-30T10:00:00Z"
        }
    ]
}
```

### Upload Document

**POST** `/api/documents/` (multipart/form-data)

Form parameters:
- `title` (string) - Document title
- `description` (string) - Document description
- `document_type` (string) - Document type
- `file` (file) - Document file (PDF, DOCX, TXT)

Response (201 Created): Document object

### Get Document Details

**GET** `/api/documents/{id}/`

Response (200 OK): Document object

### Get Document Chunks

**GET** `/api/documents/{id}/chunks/`

Response (200 OK):
```json
[
    {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "chunk_index": 0,
        "content": "This is the first chunk of text...",
        "token_count": 150
    }
]
```

### Reindex Document

**POST** `/api/documents/{id}/reindex/`

Response (200 OK):
```json
{
    "message": "Document reindexing started"
}
```

### Document Search

**POST** `/api/documents/search/search/`

Request body:
```json
{
    "query": "remote work policy",
    "limit": 10,
    "threshold": 0.5
}
```

Response (200 OK):
```json
{
    "query": "remote work policy",
    "results": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Remote Work Policy",
            "excerpt": "Employees are allowed to work remotely...",
            "relevance_score": 0.95,
            "metadata": {...}
        }
    ]
}
```

## Chat Endpoints

### Create Chat Session

**POST** `/api/chat/sessions/`

Response (201 Created):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "",
    "created_at": "2024-03-30T10:00:00Z",
    "updated_at": "2024-03-30T10:00:00Z",
    "is_active": true,
    "message_count": 0
}
```

### Send Chat Message

**POST** `/api/chat/sessions/{id}/send_message/`

Request body:
```json
{
    "content": "What is the vacation policy?"
}
```

Response (200 OK):
```json
{
    "user_message": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "role": "user",
        "content": "What is the vacation policy?",
        "created_at": "2024-03-30T10:00:00Z"
    },
    "assistant_message": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "role": "assistant",
        "content": "Based on our company policies, employees are entitled to...",
        "sources": [
            {
                "title": "Employee Handbook",
                "document_id": "550e8400-e29b-41d4-a716-446655440002",
                "excerpt": "Vacation policy details..."
            }
        ],
        "created_at": "2024-03-30T10:00:01Z"
    },
    "sources": [...]
}
```

### Get Chat History

**GET** `/api/chat/sessions/{id}/history/`

Response (200 OK):
```json
{
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Employee Benefits Questions",
    "messages": [...]
}
```

### Submit Feedback

**POST** `/api/chat/feedback/`

Request body:
```json
{
    "message_id": "550e8400-e29b-41d4-a716-446655440000",
    "rating": 5,
    "comment": "Very helpful response!"
}
```

Response (201 Created): Feedback object

## Search Endpoints

### Semantic Search

**POST** `/api/search/search/`

Request body:
```json
{
    "query": "remote work configuration",
    "limit": 20,
    "threshold": 0.5
}
```

Response (200 OK):
```json
{
    "query": "remote work configuration",
    "result_count": 5,
    "results": [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "title": "Remote Work Policy",
            "excerpt": "Employees...",
            "relevance_score": 0.92
        }
    ]
}
```

### Verify Index (Admin)

**POST** `/api/search/verify_index/`

Response (200 OK):
```json
{
    "collection_name": "hr_documents",
    "total_documents": 150,
    "total_chunks": 2500,
    "status": "healthy"
}
```

## Automation Endpoints

### Summarize Document

**POST** `/api/automation/tasks/summarize_document/`

Request body:
```json
{
    "document_id": "550e8400-e29b-41d4-a716-446655440000",
    "length": "medium"
}
```

Response (200 OK):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "task_type": "summarize",
    "status": "completed",
    "output_data": {
        "summary_id": "550e8400-e29b-41d4-a716-446655440002",
        "summary": "This document outlines...",
        "key_points": ["Point 1", "Point 2"]
    }
}
```

### Generate Announcement

**POST** `/api/automation/tasks/generate_announcement/`

Request body:
```json
{
    "document_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

Response (200 OK):
```json
{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "task_type": "generate_announcement",
    "status": "completed",
    "output_data": {
        "announcement_id": "550e8400-e29b-41d4-a716-446655440002",
        "title": "New Policy Announcement",
        "content": "We are pleased to announce..."
    }
}
```

### Approve Announcement

**POST** `/api/automation/announcements/{id}/approve/`

Request body:
```json
{
    "is_approved": true,
    "comment": "Looks good"
}
```

Response (200 OK): Updated announcement object

## Error Responses

### 400 Bad Request
```json
{
    "error": "Error description",
    "detail": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
    "detail": "Not found."
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal server error occurred"
}
```

## Rate Limiting

- Anonymous users: 100 requests/hour
- Authenticated users: 1000 requests/hour
- API endpoints: 10 requests/second (burst 20)

Response when rate limit exceeded (429):
```json
{
    "detail": "Request was throttled. Expected available in X seconds."
}
```

## Pagination

Default page size: 20 items

Query parameters:
- `page` (integer) - Page number
- `page_size` (integer) - Items per page (max 100)

Response includes:
```json
{
    "count": 150,
    "next": "http://...",
    "previous": "http://...",
    "results": [...]
}
```
