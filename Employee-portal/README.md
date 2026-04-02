# AI-Powered Employee Portal Backend

A production-ready Django REST API backend for an internal employee portal with AI-powered features, document management, and conversational retrieval.

## Features

### 1. **Authentication & Authorization**
- JWT token-based authentication
- User roles (admin, employee, HR)
- Secure password management
- Token refresh mechanism
- Audit logging

### 2. **Employee Management**
- Employee profiles with detailed information
- Leave request management (submit, approve, reject)
- HR announcements publication
- Department and designation management

### 3. **Document Management**
- Secure PDF, DOCX, and TXT file uploads
- Automatic text extraction and chunking
- Vector database indexing with Chroma
- Document metadata extraction
- Access audit logs

### 4. **AI Chatbot**
- Conversational retrieval chain using LangChain
- Context-aware responses using company documents
- Chat history management
- User feedback collection
- Multi-turn conversations

### 5. **Semantic Search**
- Full-text and semantic search across documents
- Relevance scoring and filtering
- Real-time indexing updates

### 6. **Automation Module**
- AI-powered document summarization
- Auto-generation of HR announcements
- Insight extraction from documents
- Approval workflows

## Tech Stack

- **Python 3.12** - Programming language
- **Django 4.2** - Web framework
- **Django REST Framework** - API framework
- **PostgreSQL** - Database
- **Chroma** - Vector database
- **LangChain** - AI orchestration
- **OpenAI API** - LLM provider
- **Redis** - Cache & message broker
- **Celery** - Async task queue
- **Docker & Docker Compose** - Containerization
- **Gunicorn** - Application server
- **Nginx** - Reverse proxy

## Project Structure

```
Employee-portal/
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── config/
│   ├── settings.py      # Django settings
│   ├── urls.py          # URL routing
│   ├── wsgi.py
│   └── asgi.py
├── apps/
│   ├── users/           # Authentication & user management
│   ├── employees/       # Employee profiles & leave management
│   ├── documents/       # Document management & processing
│   ├── chat/            # AI chatbot
│   ├── search/          # Semantic search
│   └── automation/      # AI automation tasks
├── utils/
│   ├── vector_db.py    # Vector database operations
│   ├── document_processor.py  # Document processing
│   └── exceptions.py
└── media/              # Uploaded files
```

## Installation

### Prerequisites

- Docker & Docker Compose (recommended)
- Python 3.12+
- PostgreSQL 15+
- Redis 7+
- OpenAI API key

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/employee-portal.git
cd employee-portal
```

2. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Update .env with required values**
```env
OPENAI_API_KEY=sk-your-api-key-here
SECRET_KEY=your-production-secret-key
DEBUG=False
```

4. **Start services**
```bash
docker-compose up -d
```

5. **Create superuser**
```bash
docker-compose exec web python manage.py createsuperuser
```

6. **Access the application**
- API: http://localhost:8000
- Admin: http://localhost:8000/admin

### Local Development Setup

1. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Create .env file**
```bash
cp .env.example .env
```

4. **Setup database**
```bash
python manage.py migrate
```

5. **Create superuser**
```bash
python manage.py createsuperuser
```

6. **Run development server**
```bash
python manage.py runserver
```

## API Endpoints

### Authentication

- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (returns JWT tokens)
- `POST /api/auth/refresh/` - Refresh access token
- `GET /api/auth/profile/` - Get current user profile
- `PUT /api/auth/profile/update/` - Update profile
- `POST /api/auth/change-password/` - Change password

### Employees

- `GET /api/employees/profiles/` - List employee profiles
- `GET /api/employees/profiles/my_profile/` - Get own profile
- `GET /api/employees/leave/` - List leave requests
- `POST /api/employees/leave/` - Create leave request
- `POST /api/employees/leave/{id}/approve/` - Approve leave (HR/Admin)
- `POST /api/employees/leave/{id}/cancel/` - Cancel leave request
- `GET /api/employees/announcements/` - List announcements
- `POST /api/employees/announcements/` - Create announcement (HR/Admin)

### Documents

- `GET /api/documents/` - List all documents
- `POST /api/documents/` - Upload document
- `GET /api/documents/{id}/` - Get document details
- `POST /api/documents/{id}/reindex/` - Reindex document
- `GET /api/documents/{id}/chunks/` - Get document chunks
- `GET /api/documents/{id}/metadata/` - Get document metadata
- `POST /api/documents/search/search/` - Semantic search

### Chat

- `POST /api/chat/sessions/` - Create chat session
- `GET /api/chat/sessions/` - List chat sessions
- `POST /api/chat/sessions/{id}/send_message/` - Send message
- `GET /api/chat/sessions/{id}/history/` - Get chat history
- `POST /api/chat/sessions/{id}/close/` - Close session
- `POST /api/chat/feedback/` - Submit feedback

### Search

- `POST /api/search/search/` - Perform semantic search
- `POST /api/search/verify_index/` - Verify vector DB (admin)

### Automation

- `POST /api/automation/tasks/summarize_document/` - Summarize document
- `POST /api/automation/tasks/generate_announcement/` - Generate announcement
- `GET /api/automation/summaries/` - List summaries
- `GET /api/automation/announcements/` - List generated announcements
- `POST /api/automation/announcements/{id}/approve/` - Approve announcement

## Usage Examples

### 1. User Registration and Login

```bash
# Register
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "SecurePass123!"
  }'
```

### 2. Upload Document

```bash
curl -X POST http://localhost:8000/api/documents/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "title=Company Policy 2024" \
  -F "description=Updated company policies" \
  -F "document_type=policy" \
  -F "file=@policy.pdf"
```

### 3. Chat with Documents

```bash
# Create session
curl -X POST http://localhost:8000/api/chat/sessions/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Send message (replace {session_id} with actual ID)
curl -X POST http://localhost:8000/api/chat/sessions/{session_id}/send_message/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the vacation policy?"
  }'
```

### 4. Semantic Search

```bash
curl -X POST http://localhost:8000/api/search/search/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "remote work policy",
    "limit": 10,
    "threshold": 0.5
  }'
```

### 5. Summarize Document

```bash
curl -X POST http://localhost:8000/api/automation/tasks/summarize_document/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "6f1b5a8c-1234-5678-90ab-cdef12345678",
    "length": "medium"
  }'
```

## Database Schema

### Key Models

- **CustomUser** - Extended user model with roles
- **EmployeeProfile** - Employee information
- **LeaveRequest** - Leave request management
- **HRAnnouncement** - HR announcements
- **Document** - Uploaded documents
- **DocumentChunk** - Text chunks for embedding
- **DocumentMetadata** - Document metadata
- **ChatSession** - Chat session management
- **ChatMessage** - Individual chat messages
- **AutomationTask** - Automation task records

## Configuration

### Environment Variables

```env
# Django
DEBUG=False
SECRET_KEY=your-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Database
DB_NAME=employee_portal
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo

# Redis/Celery
REDIS_URL=redis://redis:6379/0
```

## Logging

Application logs are stored in `/app/logs/`:
- `app.log` - Application logs
- `errors.log` - Error logs

## Monitoring

### Health Checks

```bash
# Check application health
curl http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check vector DB
curl -X POST http://localhost:8000/api/search/verify_index/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Performance Optimization

1. **Caching** - Redis caching for frequently accessed data
2. **Vector DB Batching** - Efficient batch embedding operations
3. **Async Processing** - Celery for document processing
4. **Database Indexing** - Optimized indexes on frequently queried fields
5. **Pagination** - Default 20 items per page

## Security

- **JWT Tokens** - Secure token-based authentication
- **Password Hashing** - PBKDF2 with salt
- **CORS** - Configurable cross-origin access
- **SSL/TLS** - Encrypted communication (production)
- **SQL Injection Protection** - Django ORM
- **CSRF Protection** - Django middleware
- **Rate Limiting** - 100 req/hr for anonymous, 1000 req/hr for users

## Deployment

### Production Deployment Checklist

- [ ] Update SECRET_KEY in .env
- [ ] Set DEBUG=False
- [ ] Configure ALLOWED_HOSTS
- [ ] Setup SSL certificates
- [ ] Configure email backend
- [ ] Setup database backups
- [ ] Configure logging
- [ ] Setup monitoring/alerting
- [ ] Configure Nginx reverse proxy
- [ ] Setup CDN for static files

### Scale horizontally with:

```bash
docker-compose up -d --scale celery_worker=3
```

## Troubleshooting

### Common Issues

1. **PostgreSQL connection error**
```bash
# Check database is running
docker-compose ps

# Check database logs
docker-compose logs db
```

2. **Vector database errors**
```bash
# Reinitialize Chroma
rm -rf vector_db/
docker-compose exec web python manage.py migrate
```

3. **OpenAI API errors**
```bash
# Verify API key in .env
# Check OpenAI account status and quota
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Write tests
5. Submit pull request

## License

MIT License - See LICENSE file

## Support

For issues and questions, please create an issue on GitHub or contact the development team.

## Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app API
- [ ] Advanced permission system
- [ ] Email notifications
- [ ] Workflow automation
- [ ] Knowledge base integration
- [ ] API rate limiting per user role
