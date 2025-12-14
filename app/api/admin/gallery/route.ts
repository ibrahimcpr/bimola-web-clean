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

  const images = await prisma.galleryImage.findMany({
    orderBy: { order: 'asc' },
  })

  return NextResponse.json(images)
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Get max order to append at the end
    const maxOrderImage = await prisma.galleryImage.findFirst({
      orderBy: { order: 'desc' },
    })
    const newOrder = maxOrderImage ? maxOrderImage.order + 1 : 0

    // Upload to Vercel Blob Storage
    const filename = `${randomUUID()}-${file.name}`
    const blob = await put(`gallery/${filename}`, file, {
      access: 'public',
      contentType: file.type,
    })

    const relativePath = blob.url

    // Save to database
    const imageId = randomUUID()
    const image = await prisma.galleryImage.create({
      data: {
        id: imageId,
        path: relativePath,
        order: newOrder,
      },
    })

    return NextResponse.json({ success: true, image })
  } catch (error) {
    console.error('Gallery upload error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    const image = await prisma.galleryImage.findUnique({ where: { id } })
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete file from Vercel Blob
    if (image.path.startsWith('https://')) {
      try {
        await del(image.path)
      } catch (err) {
        // File might not exist, continue anyway
        console.log('Could not delete file from blob:', err)
      }
    }

    // Delete from database
    await prisma.galleryImage.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

