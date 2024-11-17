# Prompt Palette

A prompt management system that efficiently organizes and manages AI prompts.

## Features ✨

- 📝 Dual-Panel Interface
  - Efficient layout for simultaneous viewing and editing
  - Real-time preview functionality
- 🔍 Advanced Search
  - Combined search across titles, content, tags, and metadata
  - Case-sensitive option
  - Special character support
- 🏷️ Smart Organization
  - Tag-based management system
  - Date range filtering
  - Like and NSFW flags
- 🔄 Real-time UI Updates
  - Immediate change reflection
  - Smooth operation
- 👥 User Management
  - Secure authentication system
  - Admin privileges
- ⚙️ Customizable Settings
  - Profile management
  - Password management
- 🔐 Security Features
  - XSS protection
  - Input validation
  - Protected routes

## Setup Instructions 🚀

1. Clone the repository:
```bash
git clone <repository-url>
cd prompt-palette
```

2. Install dependencies:
```bash
npm install
```

3. Setup database:
```bash
npm run db:push
```

4. Configure environment variables:
Required environment variables:
- `JWT_SECRET`: Secret key for JWT token generation

5. Start the application:
```bash
npm run dev
```

## Usage Guide 📖

### User Registration & Login
1. Click "Register" on the landing page to create a new account
2. Enter username and password
3. After registration, log in with your credentials

### Prompt Management
1. **Creating Prompts**
   - Click the "+" button to create a new prompt
   - Enter title, content, tags, and metadata
   - Set Like/NSFW flags as needed

2. **Search & Filter**
   - Text search: Search across titles, content, tags, metadata
   - Tag filters: Filter by specific tags
   - Date range: Filter by creation date
   - Flag filters: Filter by Like/NSFW status

3. **Editing Prompts**
   - Click a prompt to enter edit mode
   - Update content and click "Update" to save
   - Use "Format" button to format text
   - Use "Copy" button to copy content

### Account Settings
1. Click username in header to open dropdown menu
2. Select "Settings" to access account settings
3. Update username or password

### Admin Features
Admin accounts can access:
1. User management page
2. Grant/revoke admin privileges
3. Delete user accounts

## Security Features 🔒

- XSS protection implemented
- Input validation
- Secure password storage (bcrypt)
- JWT authentication
- Protected routing
- Special character sanitization

## Technical Stack 🛠

- Frontend:
  - React + TypeScript
  - Tailwind CSS
  - Shadcn UI
  - Wouter (routing)
  - SWR (state management)
- Backend:
  - Express.js
  - Node.js
- Database:
  - SQLite
- ORM: 
  - Drizzle
- Development Tools:
  - Vite
  - TypeScript
  - ESLint

## Development Environment 💻

Recommended environment:
- Node.js 20.x or higher
- npm 9.x or higher

## License 📄

Released under the MIT License. See [LICENSE](LICENSE) for details.
