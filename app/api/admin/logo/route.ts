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

    console.log('Logo upload request received')
    console.log('File:', file ? { name: file.name, type: file.type, size: file.size } : 'null')

    if (!file) {
      console.error('No file provided in request')
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      console.error('File size too large:', file.size)
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      console.error('File is empty')
      return NextResponse.json(
        { error: 'File is empty.' },
        { status: 400 }
      )
    }

    // Validate file type - images only
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.error('Invalid file type:', file.type)
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Only image files are allowed.` },
        { status: 400 }
      )
    }

    // Get current settings to delete old logo
    const existingSettings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    // Delete old logo if it exists and is not the placeholder
    if (existingSettings?.logoPath && 
        !existingSettings.logoPath.includes('logo-placeholder') &&
        existingSettings.logoPath.startsWith('https://')) {
      try {
        await del(existingSettings.logoPath)
      } catch (err) {
        // File might not exist, continue anyway
        console.log('Could not delete old logo:', err)
      }
    }

    // Upload to Vercel Blob Storage
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
    const filename = `logo-${randomUUID()}.${extension}`
    
    console.log('Uploading file to blob storage:', filename)
    const blob = await put(`logo/${filename}`, file, {
      access: 'public',
      contentType: file.type,
    })
    
    const relativePath = blob.url
    console.log('File uploaded successfully:', relativePath)

    // Update database
    const settings = await prisma.settings.update({
      where: { id: 'default' },
      data: { logoPath: relativePath },
    })

    console.log('Logo uploaded successfully:', relativePath)

    return NextResponse.json({ success: true, logoPath: relativePath, settings })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

