import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contact = await prisma.contact.findUnique({
    where: { id: 'default' },
  })

  return NextResponse.json(contact)
}

export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const contact = await prisma.contact.upsert({
      where: { id: 'default' },
      update: {
        phone: data.phone || null,
        address: data.address || null,
        instagram: data.instagram || null,
        tiktok: data.tiktok || null,
      },
      create: {
        id: 'default',
        phone: data.phone || null,
        address: data.address || null,
        instagram: data.instagram || null,
        tiktok: data.tiktok || null,
      },
    })

    return NextResponse.json({ success: true, contact })
  } catch (error) {
    console.error('Contact update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

