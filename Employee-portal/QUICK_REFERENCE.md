# Quick Reference Guide

## Project Structure

```
Employee-portal/
├── manage.py
├── config/                  # Main project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   └── celery.py
├── apps/                    # Django applications
│   ├── users/              # Authentication
│   ├── employees/          # Employee management
│   ├── documents/          # Document handling
│   ├── chat/               # AI chatbot
│   ├── search/             # Semantic search
│   └── automation/         # AI automation
├── utils/                  # Utilities
│   ├── vector_db.py
│   ├── document_processor.py
│   └── exceptions.py
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker image
├── docker-compose.yml      # Multi-container setup
├── nginx.conf              # Nginx configuration
└── Documentation files     # Guides and API docs
```

## Common Commands

### Local Development

```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Shell access
python manage.py shell

# Run tests
pytest

# Code formatting
black .
isort .
flake8 .

# Collect static files
python manage.py collectstatic --noinput
```

### Docker Commands

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View service status
docker-compose ps

# View logs
docker-compose logs web
docker-compose logs -f web  # Follow logs

# Execute command in container
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Scale workers
docker-compose up -d --scale celery_worker=3
```

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/register/` - Register
- `POST /api/auth/login/` - Login
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/profile/` - Get profile

### Employees
- `GET /api/employees/profiles/` - List profiles
- `GET /api/employees/leave/` - List leave requests
- `POST /api/employees/leave/` - Create leave request
- `GET /api/employees/announcements/` - List announcements

### Documents
- `GET /api/documents/` - List documents
- `POST /api/documents/` - Upload document
- `POST /api/documents/search/search/` - Search documents

### Chat
- `POST /api/chat/sessions/` - Create session
- `POST /api/chat/sessions/{id}/send_message/` - Send message

### Search
- `POST /api/search/search/` - Semantic search

### Automation
- `POST /api/automation/tasks/summarize_document/` - Summarize
- `POST /api/automation/tasks/generate_announcement/` - Generate announcement

## Environment Variables

```env
# REQUIRED
OPENAI_API_KEY=sk-your-key-here
SECRET_KEY=your-secret-key

# OPTIONAL (defaults provided)
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=employee_portal
DB_USER=postgres
DB_PASSWORD=postgres
VECTOR_DB_COLLECTION=hr_documents
```

## Database Models Reference

**User-related:**
- `CustomUser` - User with roles and phone
- `RefreshTokenLog` - Token audit trail

**Employee-related:**
- `EmployeeProfile` - Employee info
- `LeaveRequest` - Leave requests
- `HRAnnouncement` - HR announcements

**Document-related:**
- `Document` - Main document
- `DocumentChunk` - Text chunks
- `DocumentMetadata` - Document info
- `DocumentAccessLog` - Access tracking

**Chat-related:**
- `ChatSession` - Chat sessions
- `ChatMessage` - Messages
- `ChatFeedback` - User feedback

**Automation-related:**
- `AutomationTask` - Task records
- `DocumentSummary` - Summaries
- `GeneratedAnnouncement` - Generated announcements

## Admin Interface

Access: `http://localhost:8000/admin/`

**Available Admin Panels:**
- Users & Roles
- Employee Profiles
- Leave Requests
- HR Announcements
- Documents
- Chat Sessions
- Automation Tasks

## Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/test_users.py

# Run with coverage
pytest --cov=apps

# Run specific test class
pytest tests/test_users.py::TestUserAuthentication

# Verbose output
pytest -v
```

## Logging

**Log Files:**
- `/app/logs/app.log` - Application logs
- `/app/logs/errors.log` - Error logs

**Log Levels:**
- DEBUG - Development
- INFO - General information
- WARNING - Warnings
- ERROR - Errors
- CRITICAL - Critical issues

## Performance Tips

1. **Database:**
   - Use `select_related()` for ForeignKey
   - Use `prefetch_related()` for Many-to-Many
   - Add indexes for frequently queried fields

2. **Caching:**
   - Enable Redis caching
   - Cache expensive queries
   - Set appropriate TTL

3. **API:**
   - Use pagination
   - Implement filtering
   - Use search carefully

4. **Async:**
   - Use Celery for long-running tasks
   - Process documents asynchronously
   - Generate summaries in background

## Common Issues & Solutions

**Issue: PostgreSQL connection failed**
```bash
# Check if PostgreSQL is running
docker-compose ps db

# Check logs
docker-compose logs db

# Restart database
docker-compose restart db
```

**Issue: Vector database errors**
```bash
# Clear and reinitialize
rm -rf vector_db/
docker-compose exec web python manage.py migrate
```

**Issue: OpenAI API errors**
```bash
# Verify API key is correct
echo $OPENAI_API_KEY

# Check rate limits
# Check account status at openai.com
```

**Issue: High memory usage**
```bash
# Check container limits
docker-compose exec web free -h

# Optimize Celery workers
# Reduce number of workers
# Increase timeouts
```

**Issue: Slow queries**
```bash
# Enable query logging
LOGGING['handlers']['console']['level'] = 'DEBUG'

# Use Django debug toolbar
pip install django-debug-toolbar

# Analyze slow queries
#logs/app.log
```

## Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes**
   ```bash
   # Edit files
   # Create/update tests
   ```

3. **Run tests**
   ```bash
   pytest
   black .
   flake8 .
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/new-feature
   ```

## Useful Python Snippets

**Test API endpoint:**
```python
import requests

token = "your-jwt-token"
headers = {"Authorization": f"Bearer {token}"}

response = requests.get(
    "http://localhost:8000/api/auth/profile/",
    headers=headers
)
print(response.json())
```

**Query database:**
```python
from apps.users.models import CustomUser
from apps.documents.models import Document

# Get user
user = CustomUser.objects.get(username="john_doe")

# Get documents
docs = Document.objects.filter(status="indexed")

# Count indexed documents
count = Document.objects.filter(is_indexed=True).count()
```

**Test LangChain integration:**
```python
from utils.vector_db import VectorDB

db = VectorDB()
results = db.search("search query", top_k=5)
print(results)
```

## Git Workflow

```bash
# Clone
git clone https://github.com/yourusername/employee-portal.git

# Create feature branch
git checkout -b feature/my-feature

# Work on code
git add .
git commit -m "feat: description"

# Push
git push origin feature/my-feature

# Create pull request on GitHub
# After review and approval:
git merge
git push origin main
```

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [DRF Documentation](https://www.django-rest-framework.org/)
- [LangChain Documentation](https://python.langchain.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Chroma Documentation](https://docs.trychroma.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## Contact & Support

- GitHub Issues: Report bugs and requests
- Documentation: See README.md and guides
- Email: support@company.com
