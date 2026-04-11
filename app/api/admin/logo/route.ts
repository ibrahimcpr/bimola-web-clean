import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import crypto from 'crypto'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Geçersiz dosya tipi. JPG, PNG, SVG ve WebP formatları desteklenir.' },
        { status: 400 }
      )
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Dosya çok büyük. Maksimum 10MB olmalıdır.' },
        { status: 400 }
      )
    }

    // Delete old logo file if it's a local upload
    const existingSettings = await prisma.settings.findUnique({ where: { id: 'default' } })
    if (existingSettings?.logoPath?.startsWith('/uploads/')) {
      const oldFilePath = join(process.cwd(), 'public', existingSettings.logoPath)
      await unlink(oldFilePath).catch(() => { })
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'logo')
    await mkdir(uploadDir, { recursive: true })

    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const safeExt = ['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext) ? ext : 'png'
    const filename = `logo-${crypto.randomUUID()}.${safeExt}`
    const filePath = join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const publicPath = `/uploads/logo/${filename}`

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: { logoPath: publicPath },
      create: { id: 'default', logoPath: publicPath },
    })

    return NextResponse.json({ success: true, logoPath: publicPath, settings })
  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

