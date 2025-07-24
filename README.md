# TaskFlow

A modern, full-stack task management application built with Laravel and React, featuring real-time collaboration, Kanban boards, and team management capabilities.

## 🚀 Features

- **Kanban Board Interface**: Intuitive drag-and-drop task management with customizable columns
- **Team Collaboration**: Create and manage teams with role-based access control
- **Real-time Updates**: Live synchronization of task changes across team members
- **Task Management**: Comprehensive task creation with descriptions, due dates, priorities, and attachments
- **Activity Tracking**: Complete audit trail of all task and board activities
- **Comments System**: Threaded discussions on tasks with real-time notifications
- **User Authentication**: Secure login/registration with Laravel Sanctum
- **Responsive Design**: Mobile-first design that works on all device sizes
- **Modern UI**: Clean, accessible interface built with Radix UI and Tailwind CSS

## 🛠️ Technology Stack

### Backend
- **Laravel 12** - Modern PHP framework
- **PHP 8.2+** - Latest PHP version with enhanced performance
- **Laravel Sanctum** - API authentication
- **MySQL/PostgreSQL** - Database support
- **RESTful API** - Clean API architecture

### Frontend  
- **React 18** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **React Query** - Server state management
- **Zustand** - Client state management
- **@dnd-kit** - Modern drag-and-drop library
- **React Router** - Client-side routing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **PHP 8.2 or higher**
- **Composer** (PHP dependency manager)
- **Node.js 18 or higher** 
- **npm or yarn** (Node.js package manager)
- **Database** (MySQL 8.0+ or PostgreSQL 13+)
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Kyellog-silog/TaskFlow.git
cd TaskFlow
```

### 2. Backend Setup (Laravel)

```bash
# Navigate to backend directory
cd taskflow-backend

# Install PHP dependencies
composer install

# Create environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure your database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=taskflow
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run database migrations
php artisan migrate

# (Optional) Seed the database with sample data
php artisan db:seed

# Create storage symbolic link
php artisan storage:link
```

### 3. Frontend Setup (React)

```bash
# Navigate to frontend directory (from project root)
cd taskflow-frontend

# Install Node.js dependencies
npm install

# Create environment file (optional)
cp .env.example .env.local

# Configure API endpoint if needed
# REACT_APP_API_URL=http://localhost:8000
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd taskflow-backend

# Start Laravel development server
php artisan serve
# Server runs on http://localhost:8000
```

#### Start the Frontend Server

```bash
cd taskflow-frontend

# Start React development server
npm start
# Application runs on http://localhost:3000
```

### Using Concurrent Development

The Laravel backend includes a convenient script to run multiple services simultaneously:

```bash
cd taskflow-backend

# Run all services (web server, queue worker, logs, and frontend)
composer run dev
```

This will start:
- Laravel web server (port 8000)
- Queue worker for background jobs
- Laravel Pail for real-time logs
- Vite development server for frontend assets

## 🧪 Testing

### Backend Tests

```bash
cd taskflow-backend

# Run PHP tests
composer test
# or
php artisan test

# Run specific test file
php artisan test tests/Feature/TaskControllerTest.php

# Generate code coverage report
php artisan test --coverage
```

### Frontend Tests

```bash
cd taskflow-frontend

# Run React tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage --watchAll=false
```

## 🔧 Development

### Code Quality

#### Backend (Laravel)

```bash
cd taskflow-backend

# Format code with Laravel Pint
./vendor/bin/pint

# Run static analysis
./vendor/bin/phpstan analyse
```

#### Frontend (React)

```bash
cd taskflow-frontend

# Lint TypeScript/React code
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking
npm run type-check
```

### Database Operations

```bash
cd taskflow-backend

# Create new migration
php artisan make:migration create_new_table

# Create new model with migration
php artisan make:model ModelName -m

# Rollback migrations
php artisan migrate:rollback

# Reset database
php artisan migrate:fresh --seed
```

## 📚 API Documentation

The backend provides a RESTful API with the following main endpoints:

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get authenticated user

### Teams
- `GET /api/teams` - List user teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/{id}` - Update team
- `DELETE /api/teams/{id}` - Delete team

### Boards
- `GET /api/boards` - List boards
- `POST /api/boards` - Create new board
- `PUT /api/boards/{id}` - Update board
- `DELETE /api/boards/{id}` - Delete board

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Comments
- `GET /api/tasks/{id}/comments` - Get task comments
- `POST /api/tasks/{id}/comments` - Add comment
- `PUT /api/comments/{id}` - Update comment
- `DELETE /api/comments/{id}` - Delete comment

> **Note**: All API endpoints (except authentication) require authentication via Laravel Sanctum token.

## 🏗️ Project Structure

```
TaskFlow/
├── taskflow-backend/          # Laravel backend application
│   ├── app/
│   │   ├── Http/Controllers/  # API controllers
│   │   ├── Models/           # Eloquent models
│   │   └── Policies/         # Authorization policies
│   ├── database/
│   │   ├── migrations/       # Database migrations
│   │   └── seeders/         # Database seeders
│   ├── routes/
│   │   ├── api.php          # API routes
│   │   └── web.php          # Web routes
│   └── tests/               # Backend tests
│
├── taskflow-frontend/         # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
│
└── README.md                 # This file
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the existing code style
4. **Run tests**: Ensure all tests pass
5. **Commit your changes**: `git commit -m 'Add some feature'`
6. **Push to the branch**: `git push origin feature/your-feature-name`
7. **Submit a pull request**

### Development Guidelines

- Follow PSR-12 coding standards for PHP
- Use TypeScript for all new frontend code
- Write tests for new features
- Update documentation for any API changes
- Ensure responsive design for UI changes
- Follow conventional commit message format

## 🚨 Troubleshooting

### Common Issues

#### Backend Issues

**Composer install fails**
```bash
# Clear composer cache
composer clear-cache
composer install --no-cache
```

**Database connection errors**
- Check database credentials in `.env`
- Ensure database server is running
- Verify database exists

**Permission errors**
```bash
# Fix storage and cache permissions
chmod -R 755 storage/
chmod -R 755 bootstrap/cache/
```

#### Frontend Issues

**npm install fails**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Port already in use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9
```

**API connection issues**
- Verify backend server is running on port 8000
- Check proxy configuration in `package.json`
- Ensure CORS is properly configured in Laravel

### Environment Variables

#### Backend (.env)
```env
APP_NAME=TaskFlow
APP_ENV=local
APP_KEY=base64:generated_key_here
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=taskflow
DB_USERNAME=your_username
DB_PASSWORD=your_password

SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_APP_NAME=TaskFlow
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Laravel team for the excellent PHP framework
- React team for the powerful frontend library
- Radix UI for accessible component primitives
- Tailwind CSS for the utility-first CSS framework
- All contributors who have helped improve this project

## 📞 Support

If you encounter any issues or have questions, please:

1. Check the [Issues](https://github.com/Kyellog-silog/TaskFlow/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the problem

---

**Happy Task Managing! 🎯**