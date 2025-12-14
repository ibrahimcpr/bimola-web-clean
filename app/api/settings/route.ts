import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

  // Filter out /logo.svg since it doesn't exist on Vercel - return null instead
  if (settings && (settings.logoPath === '/logo.svg' || settings.logoPath?.startsWith('/logo'))) {
    return NextResponse.json({
      ...settings,
      logoPath: null,
    })
  }

  return NextResponse.json(settings || {})
}

