# Prompt Palette

A dual-panel prompt management system with comprehensive user authentication and state management capabilities.

## Features

### Core Features
- **Dual-Panel Interface**
  - Split-screen design for efficient workspace management
  - Side-by-side viewing and editing capabilities
  - Real-time UI updates with optimistic updates
  - Resizable panels for customized workspace
  - Keyboard shortcuts (Ctrl/Cmd + B) for panel toggling

- **Authentication & Security**
  - User registration and login system
  - Twitter OAuth integration
  - Protected route management with AuthGuard
  - Password management with visibility controls
  - Session management with JWT tokens
  - XSS protection and input sanitization
  - CSRF protection
  - Rate limiting

- **Database & Storage**
  - SQLite database with WAL mode for better performance
  - Local storage with CRUD operations
  - Automatic database migrations with rollback support
  - Data persistence and state management
  - Foreign key constraints and indexing
  - Connection pooling and timeout handling
  - Automatic cleanup and graceful shutdown

- **Search & Organization**
  - Advanced search functionality with real-time filtering
  - Tag-based organization system
  - Date range filtering with calendar interface
  - Field-specific searches
  - Metadata-based filtering
  - Full-text search capabilities
  - Sort by multiple criteria

- **User Experience**
  - Profile settings configuration
  - System notifications and toast messages
  - Real-time UI state updates
  - Multi-language support (English, Japanese)
  - Responsive design for mobile and desktop
  - Keyboard shortcuts for common actions
  - Offline support with local caching

### Technical Features
- **Logging & Monitoring**
  - Winston logger for system events
  - Debug logging tools
  - Request timing and performance monitoring
  - Error tracking with stack traces
  - Audit logging for security events
  - Health check endpoint
  - Request timeout monitoring

- **Development Tools**
  - Hot module replacement for development
  - Automated database migrations
  - TypeScript type checking
  - ESLint and Prettier integration
  - Development workflow automation
  - Process management and cleanup
  - Automated testing setup

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── ui/       # Reusable UI components
│   │   │   └── ...       # Feature-specific components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   └── pages/        # Page components
├── server/                # Backend Express server
│   ├── utils/            # Server utilities
│   │   ├── logger.ts     # Winston logger configuration
│   │   └── env-validator.ts # Environment validation
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── db.ts             # Database configuration
├── db/                   # Database schema and migrations
├── migrations/           # Database migration files
├── scripts/             # Utility scripts
│   └── migrate.ts       # Database migration script
└── logs/                # Application logs
```

## Technical Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Radix UI Components
- SWR for data fetching
- React Hook Form
- Date-fns for date handling
- Lucide React for icons
- React Resizable Panels

### Backend
- Node.js with Express
- SQLite with WAL mode
- Drizzle ORM
- Winston for logging
- JWT for authentication
- Express Session
- Better SQLite3

### Development Tools
- Vite for development server
- TypeScript for type safety
- Drizzle Kit for migrations
- ESBuild for production builds
- Prettier for code formatting
- ESLint for code quality

## Environment Variables

Required environment variables:

```env
NODE_ENV=development|production
PORT=5000
JWT_SECRET=your-jwt-secret
DATABASE_URL=file:./sqlite.db
```

## Development Workflows

The project includes several predefined workflows managed through Replit:

- **Dev Server**: Runs the development server with hot reload
  ```bash
  NODE_ENV=development tsx server/index.ts
  ```

- **Database Migration**: Handles database schema updates
  ```bash
  tsx scripts/migrate.ts
  ```

- **Generate Migrations**: Creates new migration files
  ```bash
  npx drizzle-kit generate:sqlite
  ```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Health Check

The application includes a health check endpoint at `/health` that monitors:
- Server uptime
- Database connectivity
- Environment configuration
- System status

## Error Handling

- Comprehensive error tracking
- Graceful shutdown handling
- Request timeout management (30s default)
- Automatic cleanup procedures
- Stack trace logging

## License

[MIT License](LICENSE)
