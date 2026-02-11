# UNI Manager - Deployment Guide

A comprehensive step-by-step guide to deploy UNI Manager to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Setup](#github-setup)
3. [Supabase Setup](#supabase-setup)
4. [Vercel Deployment](#vercel-deployment)
5. [Database Migration](#database-migration)
6. [Environment Configuration](#environment-configuration)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- [GitHub Account](https://github.com/)
- [Vercel Account](https://vercel.com/)
- [Supabase Account](https://supabase.com/)

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

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in the details:
   - **Name**: `university-manager`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"

### 2. Wait for Setup

- Supabase will take ~2 minutes to initialize
- You'll receive an email when ready

### 3. Get API Credentials

Once your project is ready:

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. (Optional) Enable Google, GitHub, etc.

### 5. Create Storage Buckets

1. Go to **Storage** → **New Bucket**
2. Create bucket: `assignments`
   - Public bucket: Yes
   - Save
3. Create bucket: `documents`
   - Public bucket: Yes
   - Save
4. Create bucket: `profiles`
   - Public bucket: Yes
   - Save

### 6. Set Up Row Level Security (RLS)

Go to **SQL Editor** and run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Users can only view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Profiles policies
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

-- Assignments policies
CREATE POLICY "Faculty can manage assignments" ON assignments
  FOR ALL USING (auth.uid() = faculty_id);

CREATE POLICY "Students can view assignments" ON assignments
  FOR SELECT USING (true);

-- Submissions policies
CREATE POLICY "Students can manage own submissions" ON submissions
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Faculty can view submissions" ON submissions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM assignments WHERE id = submissions.assignment_id AND faculty_id = auth.uid())
  );

-- Attendance policies
CREATE POLICY "Faculty can manage attendance" ON attendance
  FOR ALL USING (auth.uid() = marked_by);

CREATE POLICY "Students can view own attendance" ON attendance
  FOR SELECT USING (auth.uid() = student_id);

-- Notices policies
CREATE POLICY "Admins can manage notices" ON notices
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "All users can view active notices" ON notices
  FOR SELECT USING (is_active = true);

-- Complaints policies
CREATE POLICY "Students can manage own complaints" ON complaints
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all complaints" ON complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );

CREATE POLICY "Admins can update complaints" ON complaints
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN'))
  );
```

---

## Vercel Deployment

### 1. Connect GitHub to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Select "Import GitHub Repository"
4. Choose "university-manager"

### 2. Configure Project

**Framework Preset**: Next.js (auto-detected)

### 3. Add Environment Variables

In Vercel, go to **Environment Variables** and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon public key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service_role key | All |
| `RESEND_API_KEY` | Your Resend API key (optional) | All |

**Important**: Use **Production** environment for all variables.

### 4. Deploy

1. Click "Deploy"
2. Wait ~2 minutes for build
3. You'll get a URL like: `https://university-manager.vercel.app`

### 5. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Database Migration

### 1. Generate Prisma Client

If not already done:

```bash
cd unimanager-app
npx prisma generate
```

### 2. Push Schema to Supabase

```bash
npx prisma db push
```

**Note**: This is for development. For production, use Prisma Migrate:

```bash
npx prisma migrate deploy
```

### 3. Verify Tables

1. Go to Supabase **Table Editor**
2. Verify these tables exist:
   - [x] users
   - [x] profiles
   - [x] assignments
   - [x] submissions
   - [x] attendance
   - [x] notices
   - [x] complaints
   - [x] fee_structures
   - [x] fee_payments
   - [x] subjects

---

## Environment Configuration

### Development (.env.local)

Create `.env.local` in project root:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/unimanager?schema=public"

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Resend (Optional)
RESEND_API_KEY="re_xxxxxxxxxxxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"
```

### Production (Vercel)

All environment variables are configured in Vercel Dashboard.

**Never commit `.env` files to GitHub!**

---

## Post-Deployment Steps

### 1. Test Authentication

1. Visit your deployed URL
2. Try to access `/login`
3. Test user registration
4. Verify role-based redirects work

### 2. Test Core Features

- [ ] Student dashboard loads
- [ ] Faculty dashboard loads
- [ ] Admin dashboard loads
- [ ] Assignments can be created
- [ ] Submissions can be made
- [ ] Attendance can be marked
- [ ] Notices can be published
- [ ] Complaints can be submitted

### 3. Configure Email (Resend)

1. Sign up at [Resend](https://resend.com)
2. Get your API key from [Dashboard](https://resend.com/api-keys)
3. Add `RESEND_API_KEY` to Vercel environment variables
4. Verify email delivery works

### 4. Set Up Webhooks (Optional)

For real-time notifications:

1. Go to Supabase **Database** → **Webhooks**
2. Create webhook for `assignments` table
3. Create webhook for `notices` table
4. Configure endpoint: `https://your-domain.com/api/webhooks`

---

## Troubleshooting

### Build Failures

**Problem**: Build fails with TypeScript errors

**Solution**:
```bash
# Check TypeScript errors
cd unimanager-app
npx tsc --noEmit
```

**Problem**: Missing dependencies

**Solution**:
```bash
cd unimanager-app
npm install
npm run build
```

### Authentication Issues

**Problem**: Users can't sign up

**Solution**:
1. Check Supabase Auth providers are enabled
2. Verify email templates are configured
3. Check RLS policies don't block inserts

**Problem**: Session not persisting

**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check cookies are not blocked
3. Ensure middleware is running

### Database Issues

**Problem**: Cannot connect to database

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Check IP whitelist in Supabase
3. Ensure database is not paused

**Problem**: RLS policy blocking access

**Solution**:
1. Check Supabase SQL Editor
2. Review policy definitions
3. Test with different user roles

### Deployment Issues

**Problem**: 404 on pages

**Solution**:
1. Verify route structure is correct
2. Check middleware is not blocking
3. Ensure pages are not static only

**Problem**: Static files not loading

**Solution**:
1. Check `_next` directory is being served
2. Verify Next.js config
3. Clear Vercel cache and redeploy

---

## Monitoring & Analytics

### Vercel Analytics

1. Go to Vercel Dashboard → **Analytics**
2. View real-time and historical data
3. Monitor Core Web Vitals

### Supabase Logs

1. Go to Supabase Dashboard → **Logs**
2. Monitor API requests
3. Check for errors

### Error Tracking (Sentry) - Optional

1. Sign up at [Sentry](https://sentry.io)
2. Create new project
3. Install SDK:
```bash
npm install @sentry/nextjs
```
4. Configure in `next.config.ts`

---

## Security Checklist

- [ ] Enable 2FA on GitHub
- [ ] Enable 2FA on Vercel
- [ ] Enable 2FA on Supabase
- [ ] Use strong API keys
- [ ] Enable email confirmations in Supabase
- [ ] Set up RLS policies
- [ ] Regular backups enabled in Supabase
- [ ] Monitor access logs
- [ ] Use environment variables for secrets
- [ ] Regular dependency updates

---

## Performance Optimization

### Vercel Edge Network

- Already configured in `vercel.json`
- Global CDN automatically enabled

### Image Optimization

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
};
```

### Database Indexing

Supabase automatically indexes primary keys and foreign keys.

---

## Scaling Considerations

### Database

- Supabase Pro plan: 8GB database
- Monitor with Supabase Dashboard
- Consider read replicas for high traffic

### Edge Functions

- Already configured in `vercel.json`
- Automatic scaling on Vercel

### Storage

- Assignments bucket: Monitor usage
- Consider lifecycle policies
- Set upload size limits

---

## Rollback Procedure

### From Vercel Dashboard

1. Go to **Deployments**
2. Find previous working deployment
3. Click "..."
4. Select "Redeploy"

### From Git

```bash
git log --oneline
git checkout <commit-hash>
git push --force origin main
```

---

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm test            # Run tests

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npx prisma studio    # Open Prisma Studio

# Deployment
vercel deploy        # Deploy to Vercel
vercel --prod        # Deploy to production
```

### Important URLs

| Service | URL |
|---------|-----|
| Vercel Dashboard | https://vercel.com/dashboard |
| Supabase Dashboard | https://supabase.com/dashboard |
| GitHub Repository | https://github.com/yourusername/university-manager |
| Your App | https://your-app.vercel.app |

---

**Last Updated**: February 2026  
**Version**: 1.0
