# Deployment Guide

## 🚀 Quick Deployment to Vercel

### Prerequisites
- [Vercel Account](https://vercel.com)
- [Supabase Account](https://supabase.com)
- GitHub repository with code

### Step 1: Prepare Your Code

```bash
# Clone and install dependencies
git clone <your-repo-url>
cd unimanager-app
npm install

# Verify build works locally
npm run build
```

### Step 2: Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Go to **SQL Editor** and run the RLS policies:
   ```bash
   # Copy content from supabase/rls-policies.sql
   # Run in Supabase SQL Editor
   ```

3. Set up Storage buckets:
   - Go to **Storage** → **New Bucket**
   - Create `submissions` bucket (private)
   - Create `assignments` bucket (public)
   - Create `documents` bucket (private)

4. Get your credentials:
   - **NEXT_PUBLIC_SUPABASE_URL**: Settings → API → Project URL
   - **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Settings → API → anon key
   - **SUPABASE_SERVICE_ROLE_KEY**: Settings → API → service_role key

### Step 3: Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow interactive prompts)
vercel

# For production deployment
vercel --prod
```

#### Option B: Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=your-database-url
   ```
5. Click **Deploy**

### Step 4: Configure Custom Domain (Optional)

```bash
# Add custom domain
vercel domains add yourdomain.com
```

Or via Vercel Dashboard:
1. Go to **Settings** → **Domains**
2. Add your domain
3. Configure DNS records

---

## 🔧 Manual Deployment

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t unimanager .
docker run -p 3000:3000 unimanager
```

---

## ⚙️ Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | `https://xyz123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Key | `eyJhbGciOiJIUzI1NiIsInR...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | `eyJhbGciOiJIUzI1NiIsInR...` |
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://user:pass@host:5432/db` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Email service API key | Not set |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | NextAuth secret (if using) | Auto-generated |

---

## 📊 Database Setup

### 1. Apply Prisma Schema

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Or create a new migration
npx prisma migrate dev --name init
```

### 2. Seed Initial Data

```bash
# Run seed script
npx prisma db seed

# Or manually in Supabase SQL Editor
INSERT INTO permissions (...) VALUES (...);
INSERT INTO role_permissions (...) VALUES (...);
```

### 3. Verify Database

```bash
# Check database connection
npx prisma db push

# View your data
npx prisma studio
```

---

## 🔐 Security Checklist

- [ ] Enable RLS on all tables
- [ ] Set up Supabase auth providers
- [ ] Configure CORS settings
- [ ] Enable email confirmation for signups
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Set up audit logging
- [ ] Enable 2FA for admin accounts
- [ ] Use environment variables for secrets
- [ ] Regular backup configuration

---

## 📈 Monitoring & Analytics

### Vercel Analytics

1. Go to **Settings** → **Analytics**
2. Enable **Web Vitals** tracking

### Error Tracking (Optional - Sentry)

```bash
npm install @sentry/nextjs
```

```javascript
// next.config.js
const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig({
  // your config
}, {
  silent: true,
});
```

---

## 🚨 Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues

1. Check DATABASE_URL format
2. Verify IP whitelist in Supabase
3. Check RLS policies

```bash
# Test database connection
npx prisma db pull
```

### CORS Errors

Update `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

### Authentication Issues

1. Check Supabase auth settings
2. Verify redirect URLs
3. Check RLS policies on auth.users

---

## 📋 Post-Deployment Checklist

- [ ] All tests passing
- [ ] Build successful
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Analytics configured
- [ ] Error tracking set up
- [ ] Backup schedule configured

---

## 🔄 Updating Deployment

### Via Git Push

```bash
# Make changes
git add .
git commit -m "Update description"
git push origin main

# Vercel automatically deploys
```

### Via Vercel CLI

```bash
# Deploy new version
vercel --prod
```

---

## 📞 Support

- **Documentation**: `/docs/README.md`
- **API Docs**: `/docs/API.md`
- **Test Results**: `/docs/TEST_RESULTS.md`
- **Issues**: GitHub Issues

---

*Last Updated: February 12, 2026*
