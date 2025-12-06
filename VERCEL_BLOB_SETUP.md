# Vercel Blob Storage Setup Guide

## Why Vercel Blob?

Vercel's serverless functions use a **read-only filesystem**, so you cannot write files to `/public` or any local directory. Vercel Blob Storage is the solution for file uploads on Vercel.

## Step 1: Create Vercel Blob Store

1. Go to your **Vercel Dashboard** → Your Project
2. Click on the **Storage** tab
3. Click **Create Database**
4. Select **Blob** (not Postgres)
5. Choose a plan (Hobby plan is free for small projects)
6. Click **Create**

## Step 2: Environment Variable (Automatic)

When you create the Blob store, Vercel **automatically** adds the `BLOB_READ_WRITE_TOKEN` environment variable to your project. You don't need to do anything manually.

To verify:
1. Go to **Settings** → **Environment Variables**
2. You should see `BLOB_READ_WRITE_TOKEN` listed
3. It should be available for **Production**, **Preview**, and **Development** environments

## Step 3: Commit and Push Code Changes

Make sure you've committed all the changes:

```bash
git add .
git commit -m "Switch file uploads to Vercel Blob Storage"
git push
```

## Step 4: Clear Build Cache and Redeploy

1. Go to **Settings** → **General**
2. Scroll down to **Clear Build Cache**
3. Click **Clear** button
4. Go to **Deployments** tab
5. Click **Redeploy** on the latest deployment

**OR** just push a new commit to trigger a fresh deployment.

## Step 5: Verify It's Working

After redeployment:

1. Try uploading a menu image in the admin panel
2. Try uploading a gallery image
3. Try uploading a logo

All uploads should now work without errors!

## Troubleshooting

### Error: "ENOENT: no such file or directory, mkdir '/var/task/public'"

This means:
- ❌ The new code hasn't been deployed yet, OR
- ❌ The `BLOB_READ_WRITE_TOKEN` is missing

**Solution:**
1. Verify `BLOB_READ_WRITE_TOKEN` exists in Vercel Environment Variables
2. Clear build cache and redeploy
3. Check deployment logs to ensure the build succeeded

### Error: "BLOB_READ_WRITE_TOKEN is not defined"

**Solution:**
1. Make sure you created the Blob store in Vercel
2. Check Settings → Environment Variables for `BLOB_READ_WRITE_TOKEN`
3. If missing, create the Blob store again or manually add the token

### Files Not Appearing After Upload

- Check the database - file paths should now be URLs starting with `https://`
- The URLs are stored in the database instead of local paths
- These URLs are publicly accessible

## What Changed?

- ✅ Menu uploads → Now stored in Vercel Blob
- ✅ Gallery images → Now stored in Vercel Blob  
- ✅ Logo uploads → Now stored in Vercel Blob
- ✅ Files are accessible via public URLs
- ✅ No filesystem writes needed

## Important Notes

- **Free Tier**: Vercel Blob has a generous free tier for small projects
- **File URLs**: Uploaded files get URLs like `https://[blob-url]/menu/filename.jpg`
- **Database**: These URLs are stored in your PostgreSQL database
- **No Local Files**: Files are never written to the server filesystem

