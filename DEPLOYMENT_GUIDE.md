# UNI Manager - Deployment Guide

A comprehensive step-by-step guide to deploy UNI Manager to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [GitHub Setup](#github-setup)
4. [Supabase Setup](#supabase-setup)
5. [Database Schema Setup](#database-schema-setup)
6. [Vercel Deployment](#vercel-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Post-Deployment Steps](#post-deployment-steps)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- [GitHub Account](https://github.com/)
- [Vercel Account](https://vercel.com/)
- [Supabase Account](https://supabase.com/)

---

## Pre-Deployment Checklist

### ⚠️ IMPORTANT: Security First

**Never commit `.env` files to GitHub!**

Before pushing to GitHub:

```bash
# Check if .env is in .gitignore
cat .gitignore | grep -E "^\.env"

# Should output:
# .env
# .env.local
# .env.*.local

# Verify .env files are NOT tracked
git status
# Should NOT show any .env files
```

### Build Verification

Test the build locally before deploying:

```bash
cd unimanager-app
npm install
npm run build
```

If build succeeds, you're ready to deploy!

---

## GitHub Setup

### 1. Push Code to GitHub

```bash
# Navigate to your project
cd unimanager-app

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: UNI Manager - College Management SaaS"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/university-manager.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 2. Verify Repository

1. Go to [GitHub](https://github.com)
2. Navigate to your repository
3. Verify all files are uploaded
4. **CRITICAL**: Confirm no `.env` files are in the repository

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the details:
   - **Name**: `university-manager`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., Singapore for India/Asia)
4. Click "Create new project"

### 2. Wait for Setup

- Supabase will take ~2 minutes to initialize
- You'll receive an email when ready

### 3. Get Database Connection String

1. Go to **Project Settings** → **Database**
2. Under **Connection string**, select **URI** tab
3. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxx.supabase.co:5432/postgres
   ```
4. Save this - you'll need it for environment variables

### 4. Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### 5. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. (Optional) Enable Google, GitHub, etc.
4. Go to **Authentication** → **Email Templates**
5. Customize confirmation emails (optional)

---

## Database Schema Setup

### 1. Configure Prisma

UNI Manager uses **Prisma 7** with a config-based setup.

**Verify your `prisma.config.ts`:**

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

**Verify your `prisma/schema.prisma`:**

```prisma
datasource db {
  provider = "postgresql"
  // Note: URL is now in prisma.config.ts, not here
}
```

### 2. Set Up Environment Variables

Create `.env` file in project root (DO NOT COMMIT THIS):

```env
# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxx.supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
```

### 3. Generate Prisma Client

```bash
cd unimanager-app
npx prisma generate
```

### 4. Push Schema to Database

```bash
# This creates all tables in Supabase
npx prisma db push
```

**Expected output:**
```
Your database is now in sync with your Prisma schema.
```

### 5. Verify Tables

1. Go to Supabase **Table Editor**
2. Verify these tables were created:
   - [x] institutions
   - [x] branches
   - [x] users
   - [x] profiles
   - [x] students
   - [x] faculty
   - [x] subjects
   - [x] enrollments
   - [x] assignments
   - [x] submissions
   - [x] attendance
   - [x] notices
   - [x] complaints
   - [x] fee_structures
   - [x] fee_payments
   - [x] notifications
   - [x] permissions
   - [x] role_permissions
   - [x] audit_logs
   - [x] sessions

### 6. Set Up Row Level Security (RLS)

**Go to Supabase SQL Editor and run these policies:**

```sql
-- ========================================
-- UNI Manager - Row Level Security (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ========================================
-- USERS & PROFILES
-- ========================================

-- Users can view own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles are viewable by all authenticated users
CREATE POLICY "Profiles are viewable by all" ON profiles
  FOR SELECT USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- STUDENTS
-- ========================================

-- Students can view own record
CREATE POLICY "Students can view own record" ON students
  FOR SELECT USING (auth.uid() = user_id);

-- Faculty can view students in their branch
CREATE POLICY "Faculty can view branch students" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM faculty f
      JOIN subjects s ON s.faculty_id = f.id
      WHERE f.user_id = auth.uid()
      AND s.branch_id = students.branch_id
    )
  );

-- Admins can manage all students
CREATE POLICY "Admins can manage students" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- FACULTY
-- ========================================

-- Faculty can view own record
CREATE POLICY "Faculty can view own record" ON faculty
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage faculty
CREATE POLICY "Admins can manage faculty" ON faculty
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- ========================================
-- ASSIGNMENTS
-- ========================================

-- Faculty can manage own assignments
CREATE POLICY "Faculty can manage assignments" ON assignments
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM faculty WHERE id = assignments.faculty_id
    )
  );

-- Students can view active assignments
CREATE POLICY "Students can view assignments" ON assignments
  FOR SELECT USING (is_active = true);

-- ========================================
-- SUBMISSIONS
-- ========================================

-- Students can manage own submissions
CREATE POLICY "Students can manage submissions" ON submissions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = submissions.student_id
    )
  );

-- Faculty can view submissions for their assignments
CREATE POLICY "Faculty can view submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assignments a
      JOIN faculty f ON f.id = a.faculty_id
      WHERE a.id = submissions.assignment_id
      AND f.user_id = auth.uid()
    )
  );

-- ========================================
-- ATTENDANCE
-- ========================================

-- Faculty can mark attendance
CREATE POLICY "Faculty can mark attendance" ON attendance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM faculty WHERE user_id = auth.uid()
    )
  );

-- Students can view own attendance
CREATE POLICY "Students can view attendance" ON attendance
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM students WHERE id = attendance.student_id
    )
  );

-- ========================================
-- NOTICES
-- ========================================

-- Admins can manage notices
CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM users 
      WHERE role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- All users can view active notices
CREATE POLICY "All users can view notices" ON notices
  FOR SELECT USING (is_active = true);

-- ========================================
-- COMPLAINTS
-- ========================================

-- Students can manage own complaints
CREATE POLICY "Students can manage complaints" ON complaints
  FOR ALL USING (auth.uid() = student_id);

-- Admins can view all complaints
CREATE POLICY "Admins can view complaints" ON complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Admins can update complaints
CREATE POLICY "Admins can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
```

### 7. Create Storage Buckets

1. Go to **Storage** → **New Bucket**
2. Create these buckets with Public access:
   - `assignments` - For assignment uploads
   - `submissions` - For student submissions
   - `profiles` - For profile pictures
   - `documents` - For general documents

---

## Vercel Deployment

### 1. Connect GitHub to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select "Import GitHub Repository"
4. Choose your "university-manager" repository

### 2. Configure Project

**Framework Preset**: Next.js (auto-detected)

**Build Settings**:
- Build Command: `npm run build` (default)
- Output Directory: `.next` (default)
- Install Command: `npm install` (default)

### 3. Add Environment Variables

In Vercel, go to **Settings** → **Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@db.xxxxxxxxxx.supabase.co:5432/postgres` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `your-service-role-key` | Production |
| `JWT_SECRET` | `your-jwt-secret-minimum-32-chars` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `NODE_ENV` | `production` | Production |

**Important**: 
- Click "Save" after adding each variable
- Ensure all variables are set for **Production** environment
- Never share or commit these values

### 4. Deploy

1. Click "Deploy"
2. Wait ~2-3 minutes for the build
3. You'll get a URL like: `https://university-manager.vercel.app`

### 5. Verify Deployment

1. Visit your deployed URL
2. Check the login page loads: `/login`
3. Test user registration

### 6. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` environment variable

---

## Environment Configuration

### Development (.env.local)

Create `.env.local` in project root (NOT committed to Git):

```env
# ===========================================
# UNI Manager - Environment Variables
# ===========================================

# Database Connection (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxx.supabase.co:5432/postgres"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# JWT Secret (generate a secure random string, min 32 chars)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
```

### Production (Vercel)

All environment variables are configured in Vercel Dashboard.

**Security Best Practices:**
- ✅ Use strong, unique passwords
- ✅ Generate secure JWT secrets (use `openssl rand -base64 32`)
- ✅ Rotate keys regularly
- ✅ Never commit .env files
- ✅ Use Vercel's environment variable encryption

---

## Post-Deployment Steps

### 1. Test Authentication Flow

1. Visit your deployed URL
2. Navigate to `/login`
3. Try user registration
4. Verify email confirmation (if enabled)
5. Test login with different roles

### 2. Test Core Features

Create test accounts for each role:

**Student Account:**
- [ ] Dashboard loads
- [ ] Can view assignments
- [ ] Can submit assignments
- [ ] Can view attendance
- [ ] Can view notices
- [ ] Can submit complaints

**Faculty Account:**
- [ ] Dashboard loads
- [ ] Can create assignments
- [ ] Can grade submissions
- [ ] Can mark attendance
- [ ] Can publish notices

**Admin Account:**
- [ ] Dashboard loads
- [ ] Can manage users
- [ ] Can manage institutions
- [ ] Can view all complaints
- [ ] Can manage fee structures

### 3. Configure Email (Optional)

For production email delivery:

1. Sign up at [Resend](https://resend.com)
2. Get your API key
3. Add to Vercel environment variables:
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`

### 4. Enable Analytics

**Vercel Analytics:**
1. Go to Vercel Dashboard → **Analytics**
2. Enable for your project
3. Monitor performance metrics

**Supabase Monitoring:**
1. Go to Supabase Dashboard → **Reports**
2. Monitor database usage
3. Set up alerts for high usage

---

## Troubleshooting

### Build Failures

**Problem**: TypeScript compilation errors

**Solution**:
```bash
# Check for TypeScript errors locally
cd unimanager-app
npx tsc --noEmit

# Common fixes:
# 1. Ensure all imports are correct
# 2. Check for missing type definitions
# 3. Verify Prisma client is generated
npx prisma generate
```

**Problem**: Prisma schema validation errors

**Solution**:
```bash
# Validate Prisma schema
npx prisma validate

# Format schema
npx prisma format

# Regenerate client
npx prisma generate
```

**Problem**: Missing dependencies

**Solution**:
```bash
cd unimanager-app
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
1. Verify `DATABASE_URL` format:
   ```
   postgresql://postgres:PASSWORD@db.xxxxxxxxxx.supabase.co:5432/postgres
   ```
2. Check Supabase project is active (not paused)
3. Verify password is correct
4. Check IP restrictions in Supabase

**Problem**: "relation does not exist" errors

**Solution**:
```bash
# Push schema to database
npx prisma db push

# Or for production migrations:
npx prisma migrate deploy
```

### Authentication Issues

**Problem**: Users can't sign up/login

**Solution**:
1. Verify Supabase Auth is enabled
2. Check `NEXT_PUBLIC_SUPABASE_URL` and keys are correct
3. Verify RLS policies allow inserts/updates
4. Check browser console for errors

**Problem**: Session not persisting

**Solution**:
1. Verify cookies are not blocked
2. Check Supabase Auth settings
3. Ensure middleware is running
4. Clear browser cookies and retry

### Deployment Issues

**Problem**: 404 errors on dynamic routes

**Solution**:
1. Check `vercel.json` configuration
2. Verify routes are not static only
3. Ensure API routes exist

**Problem**: Environment variables not working

**Solution**:
1. Verify variables are set in Vercel Dashboard
2. Redeploy after adding variables
3. Check variable names are correct
4. Ensure no trailing spaces

**Problem**: Images not loading

**Solution**:
1. Check storage bucket permissions
2. Verify bucket is public
3. Check image URLs are correct

### Performance Issues

**Problem**: Slow page loads

**Solution**:
1. Enable Vercel Analytics
2. Check Core Web Vitals
3. Optimize images with Next.js Image
4. Consider enabling ISR for static pages

---

## Security Checklist

- [ ] Enable 2FA on GitHub account
- [ ] Enable 2FA on Vercel account
- [ ] Enable 2FA on Supabase account
- [ ] Use strong, unique database password
- [ ] Generate secure JWT secret (32+ characters)
- [ ] Enable RLS policies on all tables
- [ ] Verify no secrets in Git history
- [ ] Enable email confirmations (recommended)
- [ ] Set up regular database backups
- [ ] Configure proper CORS settings
- [ ] Enable Supabase rate limiting
- [ ] Monitor access logs regularly

---

## Rollback Procedure

### From Vercel Dashboard

1. Go to **Deployments**
2. Find previous working deployment
3. Click "..." menu
4. Select "Promote to Production"

### Emergency Rollback

```bash
# Revert to previous commit
git log --oneline
git revert HEAD
git push origin main
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio
npx prisma migrate dev   # Create migration
npx prisma migrate deploy # Deploy migrations

# Deployment
vercel               # Deploy to Vercel
vercel --prod        # Deploy to production
```

### Important URLs

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| Your App | https://your-app.vercel.app |

### Support Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated**: February 2026  
**Version**: 2.0  
**Prisma Version**: 7.x

---

## Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review error logs in Vercel Dashboard
3. Check Supabase logs for database errors
4. Verify all environment variables are set correctly
5. Test locally before deploying
