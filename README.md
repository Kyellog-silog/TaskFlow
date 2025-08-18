# TaskFlow

TaskFlow is a modern task management application designed to help teams collaborate efficiently. It features a Kanban-style board interface with drag-and-drop functionality, user authentication, and real-time updates.

![TaskFlow Screenshot](https://via.placeholder.com/800x450?text=TaskFlow+Screenshot)

## Features

- **Kanban Board**: Visualize your workflow with customizable columns
- **Drag-and-Drop Interface**: Easily move tasks between different stages
- **User Authentication**: Secure login and registration system
- **Team Collaboration**: Assign tasks to team members and track progress
- **Task Management**: Create, update, and delete tasks with detailed information
- **Role-Based Permissions**: Different access levels for admins and regular members
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

## Move database to Supabase (PostgreSQL)

Quick steps (Windows PowerShell):

1. In `taskflow-backend/.env`, set:
	- `DB_CONNECTION=pgsql`
	- `DB_HOST=your-supabase-host.supabase.co` (or the pooler host)
	- `DB_PORT=5432` (or 6543 for pooler)
	- `DB_DATABASE=postgres`
	- `DB_USERNAME=postgres`
	- `DB_PASSWORD=<your password>`
	- `DB_SSLMODE=require`

2. From the backend folder, run:
	- `php artisan db:check-pgsql` to verify connection
	- `php artisan migrate --force` to create schema on Supabase
	- Optional data copy from local sqlite: `php artisan db:copy-sqlite-to-pgsql --truncate`

3. Update CORS and Sanctum settings for your deployed domains.

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching and caching
- **TailwindCSS** for styling
- **@dnd-kit** for drag-and-drop functionality
- **Radix UI** components for accessible UI elements
- **Axios** for API requests

### Backend
- **Laravel 12** PHP framework
- **Laravel Sanctum** for authentication
- **SQLite** database (configurable to use MySQL or PostgreSQL)
- **RESTful API** architecture
