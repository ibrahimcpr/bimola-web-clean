import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya tipi. Sadece JPG, PNG ve WebP formatları desteklenir.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. Maksimum 10MB olmalıdır.' },
        { status: 400 }
      )
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'gallery')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()?.toLowerCase()?.replace('jpg', 'jpg') || 'jpg'
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const filename = `${crypto.randomUUID()}.${safeExt}`
    const filePath = join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const publicPath = `/uploads/gallery/${filename}`

    const lastImage = await prisma.galleryImage.findFirst({
      orderBy: { order: 'desc' },
    })
    const order = lastImage ? lastImage.order + 1 : 0

    const image = await prisma.galleryImage.create({
      data: {
        id: crypto.randomUUID(),
        path: publicPath,
        order,
      },
    })

    return NextResponse.json({ success: true, image })
  } catch (error) {
    console.error('Gallery upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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

    // Delete physical file if it's a local upload
    if (image.path.startsWith('/uploads/')) {
      const filePath = join(process.cwd(), 'public', image.path)
      await unlink(filePath).catch(() => { })
    }

    await prisma.galleryImage.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Gallery delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

