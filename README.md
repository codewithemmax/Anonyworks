# 🎭 AnonyWorks

> The bridge for honest, anonymous feedback powered by AI

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Features

- 🔐 **True Anonymity** - Military-grade encryption and AI-powered content scrubbing
- 🤖 **Gemini-Powered** - Advanced AI removes identifying information while preserving feedback essence
- 📊 **Actionable Insights** - Transform anonymous feedback into data-driven decisions
- 🎨 **Modern UI** - Dark theme with glassmorphism effects and smooth animations
- 🔑 **Secure Authentication** - JWT tokens, OTP verification, and Google OAuth
- ⚡ **Real-time** - Fast, responsive, and built for scale

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **React Router** for navigation
- **Supabase** for authentication

### Backend
- **Node.js** with Express
- **PostgreSQL** (Supabase)
- **JWT** for authentication
- **bcrypt** for password hashing
- **Brevo** for email (OTP)

## 📸 Screenshots

### Landing Page
Beautiful hero section with glassmorphism feature cards

### Multi-Step Signup
Intuitive flow for Individual and Company accounts

### Login with Google OAuth
Seamless authentication with multiple providers

## 🛠️ Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/anonyworks.git
cd anonyworks
```

### 2. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Or install individually
npm run install:frontend
npm run install:backend
```

### 3. Configure Backend

Create `.env` file in `backend/` directory:

```env
PORT=3001
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your_random_secret_key_here
BREVO_API_KEY=your_brevo_api_key_optional
```

**Get Supabase Connection String:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Settings → Database → Connection string
3. Copy and replace `[PASSWORD]` with your database password

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Configure Frontend

Create `.env` file in `frontend/` directory:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get Supabase Keys:**
1. Supabase Dashboard → Settings → API
2. Copy **Project URL** and **anon public** key

### 5. Initialize Database

```bash
cd backend
npm run init-db
```

This creates the required database tables:
- `users` - User accounts
- `otp_codes` - OTP verification codes

### 6. Start Development Servers

```bash
# From root directory - runs both frontend and backend
npm run dev

# Or run individually
npm run dev:frontend  # http://localhost:5173
npm run dev:backend   # http://localhost:3001
```

## 🔐 Google OAuth Setup (Optional)

### 1. Enable Google Provider in Supabase
1. Supabase Dashboard → Authentication → Providers
2. Enable **Google**

### 2. Create Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth client ID (Web application)
4. Add authorized redirect URI:
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
5. Copy **Client ID** and **Client Secret**

### 3. Configure Supabase
1. Paste credentials in Supabase → Authentication → Providers → Google
2. Save

## 📁 Project Structure

```
anonyworks/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── utils/           # Utilities (API, Supabase)
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── public/              # Static assets
│   ├── .env                 # Environment variables
│   └── package.json
│
├── backend/                 # Node.js backend
│   ├── server.js           # Express server & API routes
│   ├── db.js               # PostgreSQL connection
│   ├── auth.js             # JWT utilities
│   ├── init-db.js          # Database schema
│   ├── .env                # Environment variables
│   └── package.json
│
├── BACKEND-DOCUMENTATION.md # Complete backend guide
├── package.json            # Root scripts
└── README.md               # This file
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/send-otp` - Send OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and get JWT token

### Protected Routes
- `GET /api/user/profile` - Get user profile (requires JWT)

### Health Check
- `GET /api/health` - Server status

## 🧪 Testing

### Backend API
```bash
# Signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","name":"Test User","userType":"individual"}'

# Login
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Verify OTP (check backend console for OTP)
curl -X POST http://localhost:3001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# Get Profile
curl http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security Features

- ✅ **Password Hashing** - bcrypt with 10 salt rounds
- ✅ **JWT Authentication** - Stateless, secure tokens (7-day expiry)
- ✅ **OTP Verification** - 6-digit codes with 5-minute expiry
- ✅ **SQL Injection Protection** - Parameterized queries
- ✅ **CORS Enabled** - Secure cross-origin requests
- ✅ **Environment Variables** - Sensitive data protection

## 📚 Documentation

- [Backend Documentation](BACKEND-DOCUMENTATION.md) - Complete backend architecture guide
- API endpoints, authentication flow, database schema, and more


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
