import { NextRequest, NextResponse } from 'next/server'
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

  // Uploads are temporarily disabled
  return NextResponse.json(
    { error: 'Uploads are temporarily disabled' },
    { status: 503 }
  )
}

