import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
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

    if (existingMenu?.imagePath) {
      try {
        const oldFilepath = join(process.cwd(), 'public', existingMenu.imagePath)
        await unlink(oldFilepath)
      } catch (err) {
        // File might not exist, continue anyway
      }
    }

    // Save new file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'menu')
    await mkdir(uploadsDir, { recursive: true })

    const filename = `menu-${randomUUID()}.jpg`
    const filepath = join(uploadsDir, filename)
    await writeFile(filepath, buffer)

    const relativePath = `/uploads/menu/${filename}`

    // Update database
    const menu = await prisma.menu.upsert({
      where: { id: 'default' },
      update: { imagePath: relativePath },
      create: {
        id: 'default',
        imagePath: relativePath,
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

