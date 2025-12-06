# Vercel Deployment Guide

## Important: Database Setup

**SQLite does NOT work on Vercel** because Vercel uses a read-only filesystem. You must use **PostgreSQL** for production.

## Step 1: Set up Vercel Postgres

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Choose a plan (Hobby plan is free)
6. Create the database

## Step 2: Get Database Connection String

1. In your Vercel project, go to **Storage** → Your Postgres database
2. Click on **.env.local** tab
3. Copy the `POSTGRES_PRISMA_URL` or `POSTGRES_URL_NON_POOLING`
4. This is your `DATABASE_URL`

## Step 3: Set Environment Variables in Vercel

In your Vercel project settings → **Environment Variables**, add:

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=your-secure-password
```

**Important**: 
- Use the connection string from Vercel Postgres
- Make sure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set
- The `DATABASE_URL` should start with `postgresql://`

## Step 4: Update Prisma Schema

The schema has been updated to use PostgreSQL. Make sure you've committed the changes:

```bash
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL for Vercel"
git push
```

## Step 5: Run Database Migrations

After deploying to Vercel, you need to run migrations. You can do this via:

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link your project
vercel link

# Run migrations
npx prisma migrate deploy
```

### Option B: Vercel Dashboard

1. Go to your project → **Settings** → **Build & Development Settings**
2. Add a build command that includes migrations:
   ```
   prisma generate && prisma migrate deploy && next build
   ```

### Option C: Manual Migration via Vercel CLI

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

## Step 6: Seed the Database

After migrations, seed the database:

```bash
# Using Vercel CLI
vercel env pull .env.local
npm run db:seed
```

Or create a one-time script to seed via Vercel's environment.

## Troubleshooting

### "Internal Server Error" on Login

1. **Check environment variables**: Make sure `DATABASE_URL`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` are set in Vercel
2. **Check database connection**: Verify the `DATABASE_URL` is correct
3. **Check migrations**: Make sure migrations have run (`npx prisma migrate deploy`)
4. **Check logs**: Go to Vercel dashboard → Your project → **Logs** to see detailed error messages

### Database Connection Errors

- Verify `DATABASE_URL` format: `postgresql://user:password@host:5432/database?schema=public`
- Make sure the database is created and running in Vercel
- Check if your IP needs to be whitelisted (usually not needed for Vercel Postgres)

### Session Errors

- Make sure the `Session` table exists (created by migrations)
- Check that cookies are being set correctly (check browser DevTools → Application → Cookies)

## Alternative: Use SQLite for Local, PostgreSQL for Production

If you want to keep SQLite for local development:

1. Create `prisma/schema.sqlite.prisma` (copy of current schema with SQLite)
2. Use environment-based schema selection
3. Or use different `DATABASE_URL` formats:
   - Local: `file:./bimola.db`
   - Production: `postgresql://...`

## Quick Fix: Update Environment Variables

If you're getting errors, double-check these in Vercel:

1. Go to **Settings** → **Environment Variables**
2. Verify:
   - `DATABASE_URL` - PostgreSQL connection string
   - `ADMIN_EMAIL` - Your admin email
   - `ADMIN_PASSWORD` - Your admin password
3. **Redeploy** after adding/changing variables

## After Deployment

1. Visit your domain
2. Go to `/admin/login`
3. Use your `ADMIN_EMAIL` and `ADMIN_PASSWORD`
4. If you still get errors, check Vercel logs for detailed error messages

