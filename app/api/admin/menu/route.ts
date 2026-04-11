import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Sadece JPEG ve PDF formatları kabul edilir.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. Maksimum 10MB olmalıdır.' },
        { status: 400 }
      )
    }

    // Delete old menu file if it's a local upload
    const existingMenu = await prisma.menu.findUnique({ where: { id: 'default' } })
    if (existingMenu?.imagePath?.startsWith('/uploads/')) {
      const oldFilePath = join(process.cwd(), 'public', existingMenu.imagePath)
      await unlink(oldFilePath).catch(() => { })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'menu')
    await mkdir(uploadDir, { recursive: true })

    const isPdf = file.type === 'application/pdf'
    const filename = isPdf ? `menu-${Date.now()}.pdf` : `menu-${Date.now()}.jpg`
    const filePath = join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const publicPath = `/uploads/menu/${filename}`

    const menu = await prisma.menu.upsert({
      where: { id: 'default' },
      update: { imagePath: publicPath },
      create: { id: 'default', imagePath: publicPath },
    })

    return NextResponse.json({ success: true, menu })
  } catch (error) {
    console.error('Menu upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

