import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty.' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, SVG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Get current settings to delete old logo
    const existingSettings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    // Delete old logo from Vercel Blob if it exists and is a blob URL
    if (existingSettings?.logoPath && existingSettings.logoPath.startsWith('https://')) {
      try {
        await del(existingSettings.logoPath)
      } catch (err) {
        console.log('Could not delete old logo:', err)
      }
    }

    // Upload to Vercel Blob Storage
    const filename = `logo-${randomUUID()}-${file.name}`
    const blob = await put(`logo/${filename}`, file, {
      access: 'public',
      contentType: file.type,
    })

    const logoPath = blob.url
    console.log('Uploaded logo to blob, URL:', logoPath)

    // Update database
    const settings = await prisma.settings.update({
      where: { id: 'default' },
      data: { logoPath: logoPath },
    })

    console.log('Database updated, settings.logoPath:', settings.logoPath)

    // Verify the update
    const verifySettings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })
    console.log('Verified logoPath in database:', verifySettings?.logoPath)

    return NextResponse.json({ success: true, logoPath: logoPath, settings })
  } catch (error) {
    console.error('Logo upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    )
  }
}

