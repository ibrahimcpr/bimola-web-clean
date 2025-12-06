# Vercel Environment Variables Setup

## Which Variable to Use?

You have these options from Vercel Postgres:
- `PRISMA_DATABASE_URL` - **USE THIS ONE** ✅
- `POSTGRES_URL` - Direct connection (not for Prisma)
- `POSTGRES_PRISMA_URL` - Alternative Prisma URL (if available)

## Step-by-Step Setup

### Option 1: Use PRISMA_DATABASE_URL directly (Recommended)

1. In Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Copy the value from `PRISMA_DATABASE_URL`
   - **Environment**: Production, Preview, Development (select all)

3. Also add:
   - **Name**: `ADMIN_EMAIL`
   - **Value**: Your admin email (e.g., `admin@bimola.com`)
   
   - **Name**: `ADMIN_PASSWORD`
   - **Value**: Your secure password

### Option 2: Use PRISMA_DATABASE_URL in schema (Alternative)

If you want to use `PRISMA_DATABASE_URL` directly without renaming, update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("PRISMA_DATABASE_URL")
}
```

But **Option 1 is recommended** because it's the standard Prisma convention.

## Final Environment Variables Checklist

Make sure you have these 3 variables in Vercel:

✅ `DATABASE_URL` = (value from `PRISMA_DATABASE_URL`)
✅ `ADMIN_EMAIL` = your-admin-email@example.com
✅ `ADMIN_PASSWORD` = your-secure-password

## After Setting Variables

1. **Clear Build Cache**: Settings → General → Clear Build Cache
2. **Redeploy**: Deployments → Redeploy
3. **Run Migrations**: After successful build, run:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

## Important Notes

- **DO NOT** use `POSTGRES_URL` - it's not formatted for Prisma
- **USE** `PRISMA_DATABASE_URL` - it's optimized for Prisma with connection pooling
- The connection string should start with `postgresql://` (not `file:`)

