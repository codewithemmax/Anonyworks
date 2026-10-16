# AnonyWorks

> A private space for honest, anonymous feedback

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Features

- 🔐 **Anonymous Feedback** - Share feedback without attaching your name or personal details
- 📝 **Professional Feedback Mode** - Mark messages as professional for clearer team review
- 📊 **Actionable Insights** - Transform anonymous feedback into data-driven decisions
- 🎨 **Modern UI** - Dark theme with glassmorphism effects and smooth animations
- 🔑 **Secure Authentication** - JWT tokens and bcrypt password hashing
- ⚡ **Live Updates** - Dashboard polling keeps message views current

## 🚀 Tech Stack

### Application
- **Next.js 16** with React 19 and TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **PostgreSQL** (Supabase)
- **JWT** for authentication
- **bcrypt** for password hashing

## 📸 Screenshots

### Landing Page
Beautiful hero section with glassmorphism feature cards

### Multi-Step Signup
Intuitive flow for Individual and Company accounts

### Login
Simple password-based sign in

## 🛠️ Installation

### Prerequisites
- Bun 1.x
- Node.js 20.9+ (required by Next.js 16)
- Supabase account

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/anonyworks.git
cd anonyworks
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Configure the application

Create `.env.local` in the project root:

```env
SUPABASE_DB_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[SESSION-POOLER-HOST]:6543/postgres
JWT_SECRET=your_random_secret_key_here
```

**Get Supabase Connection String:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Settings → Database → Connection string
3. Copy and replace `[PASSWORD]` with your database password

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Initialize Database

```bash
bun run db:init
```

This creates the required database tables:
- `users` - User accounts
- `pits` - Anonymous feedback spaces
- `messages` - Anonymous feedback messages

### 5. Start the application

```bash
bun run dev
```

## 📁 Project Structure

```
anonyworks/
├── app/                      # Next.js app shell and route handlers
├── lib/                      # Database and JWT helpers
├── scripts/                  # Database initialization
├── frontend/                 # Existing UI components and screens
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # API utility
│   │   ├── App.tsx          # Main app component
│   │   └── index.css        # Tailwind entry stylesheet
│   ├── public/              # Static assets
├── app/api/[...route]/       # Serverless API route handler
├── package.json              # Next.js scripts and dependencies
└── README.md               # This file
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account and return a JWT
- `POST /api/auth/login` - Sign in and return a JWT

### Protected Routes
- `GET /api/user/profile` - Get user profile (requires JWT)

### Health Check
- `GET /api/health` - Server status

## 🧪 Testing

### API
```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User","userType":"individual"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Get Profile
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 10 salt rounds
- ✅ **JWT Authentication** - Stateless, secure tokens (7-day expiry)
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **Environment Variables** - Sensitive data protection

## 📚 Documentation

- API endpoints, authentication flow, and database schema are implemented in `app/api/[...route]/route.ts`


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 👥 Authors

- **Olayinka Emmanuel** - [GitHub](https://github.com/codewithemmax)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com/) - Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Lucide](https://lucide.dev/) - Icon library

## 📧 Contact

For questions or support, please open an issue or contact [olayinkaemma27@gmail.com](mailto:olayinkaemma27@gmail.com)

---

<div align="center">
  <strong>Built with ❤️ for honest feedback</strong>
</div>
