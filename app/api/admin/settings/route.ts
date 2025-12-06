import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      update: {
        introText: data.introText,
        youtubeUrl: data.youtubeUrl || null,
        mapLat: data.mapLat,
        mapLng: data.mapLng,
        mapZoom: data.mapZoom,
        addressText: data.addressText || null,
      },
      create: {
        id: 'default',
        introText: data.introText,
        youtubeUrl: data.youtubeUrl || null,
        mapLat: data.mapLat,
        mapLng: data.mapLng,
        mapZoom: data.mapZoom,
        addressText: data.addressText || null,
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

