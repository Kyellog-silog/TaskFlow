#!/bin/bash

# TaskFlow Production Preparation Script

echo "🚀 Preparing TaskFlow for production deployment..."

# Frontend optimizations
echo "📱 Optimizing frontend..."
cd taskflow-frontend

# Remove development console.logs (keep error logs)
echo "🔧 Cleaning up console.logs..."
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs sed -i 's/console\.log.*;//g'

# Build production version
echo "🏗️  Building frontend..."
GENERATE_SOURCEMAP=false npm run build

# Backend optimizations  
echo "🔧 Optimizing backend..."
cd ../taskflow-backend

# Clear caches and optimize
echo "⚡ Optimizing Laravel..."
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# Generate optimized autoloader
composer install --optimize-autoloader --no-dev

echo "✅ TaskFlow is ready for production deployment!"
echo ""
echo "Next steps:"
echo "1. Set APP_DEBUG=false in your .env"
echo "2. Configure your production database"
echo "3. Set REACT_APP_API_URL to your production API URL"
echo "4. Deploy to your chosen platform (Railway, Render, etc.)"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions!"
