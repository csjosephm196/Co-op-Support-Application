# Co-op Support Application (CSA)

A full-stack web application for managing co-op student applications, work term reports, employer evaluations, and compliance tracking.

## Architecture

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL |
| **Auth** | JWT + TOTP (2FA via Speakeasy) |
| **Email** | Nodemailer (SMTP) |
| **File Storage** | Local disk (PDF uploads) |

## Project Structure

```
Co-op-Support-Application/
├── backend/
│   ├── migrations/        # SQL schema migrations
│   ├── uploads/           # Uploaded PDF files
│   └── src/
│       ├── config/        # Database & email configuration
│       ├── middleware/     # Auth (JWT) & file upload (Multer)
│       ├── routes/        # API route handlers
│       │   ├── auth.ts          # Login, register, 2FA, email verification
│       │   ├── applications.ts  # Student application CRUD
│       │   ├── coordinator.ts   # Review, compliance, tracker
│       │   ├── documents.ts     # PDF upload & online form
│       │   ├── employer.ts      # Assigned students & evaluations
│       │   └── invitations.ts   # Invite-only onboarding
│       ├── services/      # Business logic (email, auth)
│       ├── validators/    # Input validation (GPA, password, etc.)
│       └── index.ts       # Express server entry point
├── frontend/
│   └── src/
│       ├── components/    # Navbar, ProtectedRoute
│       ├── context/       # AuthContext (global auth state)
│       ├── pages/
│       │   ├── auth/           # Login, Register, Verify, InviteSignup
│       │   ├── student/        # Application, Documents
│       │   ├── coordinator/    # Review, Compliance, Tracker, Invitations
│       │   └── employer/       # Students, Evaluations, Upload
│       ├── services/      # Axios API client
│       └── App.tsx        # Route definitions
├── .env.example           # Environment variables template
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Database Setup

```bash
# Create the database
createdb csa_db

# Run migrations
cd backend
cp ../.env.example .env   # Edit with your DB credentials
npm install
npm run migrate
```

### 2. Backend

```bash
cd backend
npm install
npm run dev       # Runs on http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev       # Runs on http://localhost:5173
```

### Environment Variables

Copy `.env.example` to `backend/.env` and configure:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `FRONTEND_URL` | Frontend URL for CORS & email links |

## Features

### Authentication & Onboarding
- **Students**: Self-registration with email verification (6-digit code)
- **Coordinators/Employers**: Invite-only via unique one-time links
- **2FA**: Optional TOTP setup with QR code
- **Password Security**: Min 8 chars, uppercase, number, special character

### Student Portal
- **Application Form**: Auto-saving draft, GPA validation (3.0 minimum), submission confirmation
- **Document Upload**: PDF-only work term report uploads with file validation
- **Status Tracking**: Real-time application status display

### Coordinator Dashboard
- **Provisional Review**: Accept/reject pending applications with expand/lightbox view
- **Final Review**: Confirm or change provisional decisions, with bulk action support
- **Compliance Reports**: Statistics dashboard showing application counts, missing submissions
- **Missing Submissions Filter**: Lists students missing work reports or evaluations
- **Automated Reminders**: Send email reminders to students with overdue documents
- **Placement Tracker**: Track accepted students seeking/placed/withdrawn

### Employer Portal
- **Student List**: View assigned co-op students
- **Dual Evaluation Submission**: Upload scanned PDF OR fill integrated online form
- **Evaluation History**: View past submissions with confirmation numbers

### API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Student registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/verify-2fa` | 2FA verification |
| POST | `/api/auth/verify-email` | Email code verification |
| POST | `/api/auth/invite-signup` | Invite-based registration |
| GET | `/api/auth/invite/:token` | Fetch invitation details |
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/applications/mine` | Student's application |
| POST | `/api/applications/autosave` | Save application draft |
| POST | `/api/applications/submit` | Submit application |
| GET | `/api/applications` | List all (coordinator) |
| POST | `/api/coordinator/review/provisional` | Provisional decision |
| POST | `/api/coordinator/review/final` | Final decision |
| POST | `/api/coordinator/review/bulk-final` | Bulk final decisions |
| GET | `/api/coordinator/compliance` | Compliance statistics |
| GET | `/api/coordinator/missing-submissions` | Missing docs list |
| POST | `/api/coordinator/send-reminders` | Send overdue reminders |
| GET/PUT | `/api/coordinator/tracker` | Placement tracker |
| POST | `/api/documents/upload` | Student PDF upload |
| POST | `/api/documents/employer-upload` | Employer PDF upload |
| POST | `/api/documents/employer-form` | Employer online form |
| GET | `/api/employer/students` | Assigned students |
| GET | `/api/employer/evaluations` | Submitted evaluations |
| POST | `/api/invitations` | Send onboarding invite |

## Default Admin Account

After running migrations, a default admin account is created:
- **Email**: `admin@csa-portal.com`
- **Password**: `Admin123!@#`

> Change this immediately in production.

## Validation Rules

- **GPA**: Must be >= 3.0 for co-op eligibility
- **Password**: Min 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
- **File Upload**: PDF only, max 10MB
- **Student ID**: Cannot be empty
- **Full Name**: Must contain first and last name
