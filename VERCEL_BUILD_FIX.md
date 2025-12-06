# Fix Vercel Build Error: "prisma: command not found"

## The Problem
Vercel is trying to run `prisma generate` but can't find the command.

## Solution

### Step 1: Verify package.json
Make sure `prisma` is in `dependencies` (not `devDependencies`):
```json
"dependencies": {
  "prisma": "^5.7.1",
  ...
}
```

### Step 2: Clear Vercel Build Settings
1. Go to Vercel Dashboard → Your Project → **Settings**
2. Go to **Build & Development Settings**
3. **Delete/clear** any custom:
   - Install Command
   - Build Command
4. Let Vercel use the defaults from `package.json` and `vercel.json`

### Step 3: Clear Build Cache
1. In Vercel → Settings → **General**
2. Scroll to **"Clear Build Cache"**
3. Click **"Clear"**

### Step 4: Verify vercel.json
Your `vercel.json` should be:
```json
{
  "buildCommand": "npx prisma generate && next build"
}
```

**DO NOT** set `installCommand` in vercel.json - let npm's `postinstall` script handle it.

### Step 5: Commit and Push
```bash
git add package.json vercel.json
git commit -m "Fix Prisma build for Vercel"
git push
```

### Step 6: Redeploy
After pushing, Vercel will automatically redeploy. The build should now work.

## Why This Works

- `prisma` is in `dependencies` (installed in production)
- `postinstall` script runs `npx prisma generate` after `npm install`
- `buildCommand` uses `npx prisma generate` (finds prisma via npx)
- No custom `installCommand` means Vercel uses standard npm install

## If Still Failing

Check Vercel build logs. The error should show which command is failing. Make sure:
- ✅ `prisma` is in `dependencies`
- ✅ All commands use `npx prisma` (not just `prisma`)
- ✅ No custom `installCommand` in Vercel project settings
- ✅ Build cache is cleared

