# UNI Manager - College Management System

## 📋 Project Overview

**UNI Manager** is a comprehensive B2B SaaS platform for educational institution management built on Vercel + Supabase. It supports both B.Tech and Diploma courses with multiple branches.

### Supported Courses

#### B.Tech (4 Years)
- CSE-AIML (Computer Science Engineering - Artificial Intelligence & Machine Learning)
- DS (Data Science)
- Cybersecurity
- Core CSE
- ECE (Electronics & Communication Engineering)
- EEE (Electrical & Electronics Engineering)
- Mechanical Engineering
- Civil Engineering

#### Diploma (3 Years)
- Computer Engineering
- Electronics & Communication Engineering
- Electrical & Electronics Engineering
- Mechanical Engineering
- Civil Engineering

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+ (App Router) |
| **Styling** | Tailwind CSS v4 |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **ORM** | Prisma |
| **State Management** | Zustand |
| **Forms** | React Hook Form + Zod |
| **UI Components** | Radix UI + shadcn/ui |
| **Deployment** | Vercel |
| **Testing** | Jest + React Testing Library |

---

## 📁 Project Structure

```
unimanager-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Role-based dashboards
│   │   │   ├── admin/
│   │   │   ├── faculty/
│   │   │   └── student/
│   │   ├── api/               # API routes
│   │   │   ├── admin/
│   │   │   ├── assignments/
│   │   │   ├── attendance/
│   │   │   ├── auth/
│   │   │   ├── complaints/
│   │   │   ├── notices/
│   │   │   └── imports/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── auth/             # Auth components
│   │   ├── file-upload.tsx
│   │   ├── assignment-list.tsx
│   │   ├── notice-management.tsx
│   │   ├── complaint-list.tsx
│   │   └── fee-tracking.tsx
│   ├── hooks/
│   │   ├── use-dashboard.ts
│   │   └── use-permission.ts
│   ├── lib/
│   │   ├── supabase/         # Supabase config
│   │   ├── rbac.ts           # RBAC utilities
│   │   ├── audit.ts          # Audit logging
│   │   └── utils.ts
│   ├── stores/
│   │   └── auth-store.ts
│   ├── actions/              # Server Actions
│   └── types/
├── prisma/
│   └── schema.prisma          # Database schema
├── supabase/
│   └── rls-policies.sql      # RLS policies
├── docs/                     # Documentation
├── package.json
└── README.md
```

---

## 🔐 User Roles & Permissions

### Roles

| Role | Dashboard | Description |
|------|-----------|-------------|
| **Student** | `/student/dashboard` | View assignments, submit work, track attendance, pay fees |
| **Faculty** | `/faculty/dashboard` | Create assignments, grade submissions, mark attendance |
| **Admin** | `/admin/dashboard` | Manage users, view analytics, institution settings |
| **Super Admin** | `/admin/dashboard` | Full privileges, multi-tenant management |

### Permission System

The system implements a granular permission system with 45+ permissions across categories:

- **Users**: View, Create, Update, Delete, Assign Roles
- **Students**: View, Create, Update, Import
- **Faculty**: View, Create, Update
- **Assignments**: Create, Read, Update, Delete, Grade
- **Attendance**: Read, Write, Export
- **Notices**: Create, Read, Update, Delete
- **Complaints**: Create, Read, Update, Resolve
- **Fees**: View, Create, Pay
- **Subjects**: Create, Read, Update, Delete
- **Analytics**: View, Export
- **Settings**: View, Modify

### Role Hierarchy

```
SUPER_ADMIN
    ↓ (inherits all)
ADMIN
    ↓ (inherits all)
FACULTY
    ↓ (inherits all)
STUDENT
```

---

## 🗄 Database Schema

### Core Models

#### Users
```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  password_hash   String
  role            Role      @default(STUDENT)
  institution_id  String?
  pin_number      String?
  is_active       Boolean   @default(true)
  ...
}
```

#### Branch
```prisma
model Branch {
  id              String      @id @default(cuid())
  institution_id  String
  name            String      // e.g., "CSE-AIML", "Mechanical"
  code            String
  course_type     CourseType  // B_TECH or DIPLOMA
  duration_years  Int         @default(4)
  ...
}
```

#### Fee Structure
```prisma
model FeeStructure {
  id              String    @id @default(cuid())
  name            String
  amount          Float
  category        String    // tuition, exam, transport, etc.
  academic_year   String
  course_type     CourseType
  due_date        DateTime
  ...
}
```

---

## 🔒 Security Features

### 1. Row Level Security (RLS)
All tables have RLS policies enabled:
- Users can only access their own data
- Faculty can only manage their own subjects/assignments
- Admins have full access within their institution
- Super Admins have system-wide access

### 2. Middleware Protection
Route-based access control:
```typescript
const PROTECTED_ROUTES = {
  "/admin": ["ADMIN", "SUPER_ADMIN"],
  "/faculty": ["FACULTY", "ADMIN", "SUPER_ADMIN"],
  "/student": ["STUDENT", "FACULTY", "ADMIN", "SUPER_ADMIN"],
};
```

### 3. Client-Side Permission Hooks
```typescript
// Check single permission
const canEdit = usePermission("users:write");

// Check multiple permissions (any)
const canEdit = useAnyPermission(["users:write", "users:delete"]);

// Check role
const isAdmin = useRole(["ADMIN", "SUPER_ADMIN"]);
```

### 4. Protected Route Component
```tsx
<ProtectedRoute requiredRole="ADMIN">
  <AdminPanel />
</ProtectedRoute>
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd unimanager-app

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your .env file
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## 📦 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/verify-pin` - Verify student PIN

### Admin
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/role` - Update user role
- `GET /api/admin/stats` - Get dashboard statistics

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PATCH /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance

### Notices
- `GET /api/notices` - List notices
- `POST /api/notices` - Create notice
- `PATCH /api/notices/:id` - Update notice
- `DELETE /api/notices/:id` - Delete notice

### Complaints
- `GET /api/complaints` - List complaints
- `POST /api/complaints` - Submit complaint
- `PATCH /api/complaints/:id` - Update complaint status

---

## 🎨 Design System

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Deep Black | `#0A0A0A` | Primary background |
| Dark Gray | `#1A1A1A` | Cards, panels |
| Charcoal | `#2A2A2A` | Borders, dividers |
| Gold Primary | `#D4AF37` | Primary actions |
| Gold Light | `#F5E6B3` | Hover states |
| Gold Dark | `#B8960F` | Active states |

### Typography
- **Primary**: Inter (Variable Font)
- **Monospace**: JetBrains Mono

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

---

## 📦 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Manual Deployment

```bash
npm run build
npm run start
```

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
