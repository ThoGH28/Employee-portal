# Deployment Guide

Comprehensive guide for deploying Employee Portal to production.

## Pre-Deployment Checklist

- [ ] All tests passed locally
- [ ] Environment variables configured
- [ ] Database credentials set
- [ ] OpenAI API key obtained
- [ ] SSL certificates ready
- [ ] Domain name configured
- [ ] Backup strategy planned
- [ ] Monitoring system setup

## Environment Variables

Create production `.env` file with:

```env
# Django Security
DEBUG=False
SECRET_KEY=generate-strong-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com

# Database
DB_NAME=employee_portal_prod
DB_USER=postgres
DB_PASSWORD=strong-db-password
DB_HOST=db
DB_PORT=5432

# OpenAI
OPENAI_API_KEY=sk-your-api-key
OPENAI_MODEL=gpt-4-turbo

# Redis
REDIS_URL=redis://redis:6379/0

# Logging
DJANGO_LOG_LEVEL=WARNING
```

## Docker Compose Deployment

### 1. Prepare Server

```bash
# SSH into your server
ssh user@your-server.com

# Install Docker and Docker Compose
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $(whoami)
newgrp docker
```

### 2. Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/employee-portal.git
cd employee-portal

# Create .env file
cp .env.example .env
nano .env  # Edit with production values
```

### 3. Generate Django Secret Key

```bash
# Generate secure secret key
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

### 4. Start Services

```bash
# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Verify health
docker-compose ps
docker-compose logs web
```

### 5. Nginx SSL Setup

```bash
# Update nginx.conf with your domain
sudo nano nginx.conf

# Install Certbot
docker-compose exec nginx apk add --no-cache certbot certbot-nginx

# Get SSL certificate
docker-compose exec nginx certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Configure auto-renewal
docker-compose exec nginx certbot install --nginx
```

## AWS Deployment

### Using ECS (Elastic Container Service)

1. **Create ECR Repository**

```bash
aws ecr create-repository --repository-name employee-portal
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

2. **Build and Push Image**

```bash
docker build -t employee-portal:latest .
docker tag employee-portal:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-portal:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-portal:latest
```

3. **Create ECS Task Definition**

Use the Dockerfile as base and create task definition with:
- Container: 512 MB memory
- Port: 8000
- Environment variables from Secrets Manager

4. **Create RDS Instance**

```bash
aws rds create-db-instance \
  --db-instance-identifier employee-portal-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password <strong-password>
```

5. **Configure Load Balancer**

- Create ALB (Application Load Balancer)
- Point to ECS service
- Configure health checks
- Setup target groups

## Kubernetes Deployment

### Using Helm

1. **Create values.yaml**

```yaml
replicaCount: 3

image:
  repository: your-registry/employee-portal
  tag: latest

ingress:
  enabled: true
  hosts:
    - host: yourdomain.com
      paths:
        - path: /

resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"

postgresql:
  enabled: true
  auth:
    password: strong-password
```

2. **Deploy**

```bash
helm install employee-portal ./helm-chart -f values.yaml
```

## Database Backup & Recovery

### Automated Backups

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/employee-portal"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

# Backup database
docker-compose exec -T db pg_dump -U postgres employee_portal > "$BACKUP_DIR/db_$DATE.sql"

# Backup vector database
tar -czf "$BACKUP_DIR/vector_db_$DATE.tar.gz" vector_db/

# Upload to S3
aws s3 cp "$BACKUP_DIR/" s3://your-backup-bucket/employee-portal/ --recursive
EOF

# Schedule with cron
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
# Restore database
docker-compose exec db psql -U postgres employee_portal < db_backup.sql

# Restore vector database
tar -xzf vector_db_backup.tar.gz
```

## Monitoring & Logging

### Health Checks

```bash
# Application health
curl https://yourdomain.com/health/

# Database connection
docker-compose exec web python manage.py shell -c "from django.db import connection; connection.ensure_connection()"

# Vector DB health
curl -X POST https://yourdomain.com/api/search/verify_index/ \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Logging

Using Loki and Grafana:

1. **Install Loki**

```bash
docker-compose up -d loki
```

2. **Configure Promtail**

Add to docker-compose.yml for log collection

3. **Setup Grafana Dashboard**

- Connect Loki datasource
- Create dashboards for:
  - Request rates
  - Error rates
  - Response times
  - Database performance

### Application Monitoring

Using Sentry:

1. **Install Sentry SDK**

```bash
pip install sentry-sdk
```

2. **Configure in settings.py**

```python
import sentry_sdk

sentry_sdk.init(
    dsn="your-sentry-dsn",
    traces_sample_rate=0.1,
    environment="production"
)
```

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
```

### Caching Strategy

```python
# In settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient'
        }
    }
}

# Cache timeout 24 hours
CACHE_TIMEOUT = 86400
```

### CDN Setup

1. Configure CloudFront (AWS) or similar
2. Point to static files endpoint
3. Set cache expiry: 30 days for static, 1 day for dynamic

## Scaling

### Horizontal Scaling

```bash
# Scale Celery workers
docker-compose up -d --scale celery_worker=5

# Scale web servers with load balancer
# Update docker-compose with multiple web services
```

### Vertical Scaling

Increase resources in production:
- Web: 2 GB RAM, 2 CPU cores
- Database: PostgreSQL on dedicated server
- Redis: 4 GB RAM for caching

## Security Hardening

### SSL/TLS

```bash
# Generate strong DH parameters
openssl dhparam -out dhparam.pem 2048

# Update Nginx configuration
ssl_dhparam /etc/ssl/certs/dhparam.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

### Firewall Rules

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Secrets Management

Use AWS Secrets Manager or HashiCorp Vault

```bash
# Retrieve secrets
aws secretsmanager get-secret-value --secret-id employee-portal-secrets
```

### API Rate Limiting

Already configured in DRF settings. Monitor and adjust based on usage.

## Maintenance

### Regular Tasks

- [ ] Monitor logs daily
- [ ] Check disk space weekly
- [ ] Update dependencies monthly
- [ ] Run security audits quarterly
- [ ] Performance testing quarterly
- [ ] Disaster recovery drills quarterly

### Database Maintenance

```bash
# Vacuum and analyze
docker-compose exec db psql -U postgres employee_portal -c "VACUUM ANALYZE"

# Check table sizes
docker-compose exec db psql -U postgres employee_portal -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC"
```

### Log Rotation

```bash
# Configure logrotate
cat > /etc/logrotate.d/employee-portal << 'EOF'
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

## Rollback Procedure

```bash
# If deployment fails
docker-compose down
git checkout stable-version
docker-compose up -d

# Verify services
docker-compose ps
docker-compose logs
```

## Troubleshooting

### Common Issues

1. **Connection timeouts**
   - Check network policies
   - Verify database connection parameters
   - Check Redis connectivity

2. **Out of memory**
   - Increase container limits
   - Optimize queries
   - Add more workers

3. **High CPU usage**
   - Check for long-running tasks
   - Optimize database indexes
   - Profile with APM tools

## Support & Escalation

1. Developer on-call
2. DevOps team
3. Cloud provider support

Contact: devops@company.com
