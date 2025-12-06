import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, direction } = await request.json()

    if (!id || !direction) {
      return NextResponse.json(
        { error: 'ID and direction required' },
        { status: 400 }
      )
    }

    const image = await prisma.galleryImage.findUnique({ where: { id } })
    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    const currentOrder = image.order
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1

    // Find the image at the target position
    const targetImage = await prisma.galleryImage.findFirst({
      where: { order: newOrder },
    })

    if (targetImage) {
      // Swap orders
      await prisma.galleryImage.update({
        where: { id: image.id },
        data: { order: newOrder },
      })
      await prisma.galleryImage.update({
        where: { id: targetImage.id },
        data: { order: currentOrder },
      })
    } else {
      // Just update the order
      await prisma.galleryImage.update({
        where: { id: image.id },
        data: { order: newOrder },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reorder error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

