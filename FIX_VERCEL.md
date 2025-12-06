# Quick Fix for Vercel Deployment Error

## The Error
```
Error: Prisma schema validation - the URL must start with the protocol `file:`.
provider = "sqlite"
```

This means Vercel is still seeing the old SQLite schema.

## Solution

### Step 1: Verify Your Schema File

Make sure `prisma/schema.prisma` has:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**NOT**:
```prisma
datasource db {
  provider = "sqlite"  // ❌ WRONG
  url      = env("DATABASE_URL")
}
```

### Step 2: Commit and Push Changes

```bash
git add prisma/schema.prisma
git add package.json
git add vercel.json
git commit -m "Switch to PostgreSQL for Vercel"
git push
```

### Step 3: Set DATABASE_URL in Vercel

**CRITICAL**: In Vercel dashboard → Settings → Environment Variables:

1. **Delete** any old `DATABASE_URL` that starts with `file:./`
2. **Add** new `DATABASE_URL` with PostgreSQL connection string:
   - Go to Vercel → Storage → Your Postgres database
   - Copy `POSTGRES_PRISMA_URL` 
   - Paste it as `DATABASE_URL` in Environment Variables
   - It should look like: `postgresql://user:pass@host:5432/db?schema=public`

### Step 4: Clear Vercel Build Cache

1. Go to Vercel project → Settings → General
2. Scroll to "Clear Build Cache"
3. Click "Clear"

### Step 5: Redeploy

1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Or push a new commit to trigger redeploy

### Step 6: After Successful Build

Once the build succeeds, run migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy
npm run db:seed
```

Or set up automatic migrations in `vercel.json` (already done).

## Verify It's Working

After redeploy, check:
1. Build logs should show `provider = "postgresql"` (not sqlite)
2. No more "file:" protocol errors
3. Admin login should work

## If Still Getting Errors

1. **Check Vercel logs** for the exact error
2. **Verify DATABASE_URL** format in Vercel (must start with `postgresql://`)
3. **Make sure** `prisma/schema.prisma` is committed with `provider = "postgresql"`
4. **Clear build cache** and redeploy

