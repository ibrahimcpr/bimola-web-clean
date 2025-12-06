import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { put, del } from '@vercel/blob'
import { randomUUID } from 'crypto'

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const menu = await prisma.menu.findUnique({
    where: { id: 'default' },
  })

  return NextResponse.json(menu)
}

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

    // Validate file type - only JPEG
    const allowedTypes = ['image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG files are allowed.' },
        { status: 400 }
      )
    }

    // Delete old image if exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id: 'default' },
    })

    if (existingMenu?.imagePath && existingMenu.imagePath.startsWith('https://')) {
      try {
        // Delete from Vercel Blob if it's a blob URL
        await del(existingMenu.imagePath)
      } catch (err) {
        // File might not exist, continue anyway
        console.log('Could not delete old file:', err)
      }
    }

    // Upload to Vercel Blob Storage
    const filename = `menu-${randomUUID()}.jpg`
    const blob = await put(`menu/${filename}`, file, {
      access: 'public',
      contentType: file.type,
    })

    const imagePath = blob.url

    // Update database
    const menu = await prisma.menu.upsert({
      where: { id: 'default' },
      update: { imagePath: imagePath },
      create: {
        id: 'default',
        imagePath: imagePath,
      },
    })

    return NextResponse.json({ success: true, menu })
  } catch (error) {
    console.error('Menu upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

