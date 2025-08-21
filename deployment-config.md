# TaskFlow Deployment Configuration

# Frontend Environment Variables (create .env file)
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_ENVIRONMENT=production

# Backend Environment Variables (update .env file)
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-api-domain.com
SANCTUM_STATEFUL_DOMAINS=your-frontend-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Database (Use hosted PostgreSQL)
DB_CONNECTION=pgsql
DB_HOST=your-postgres-host
DB_PORT=5432
DB_DATABASE=taskflow_production
DB_USERNAME=your-username
DB_PASSWORD=your-password
