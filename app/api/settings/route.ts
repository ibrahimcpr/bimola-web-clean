import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

  // Filter out /logo.svg since it doesn't exist on Vercel - return null instead
  // Also automatically fix the database if it has /logo.svg
  if (settings && (settings.logoPath === '/logo.svg' || (settings.logoPath?.startsWith('/logo') && !settings.logoPath.startsWith('http')))) {
    // Auto-fix: Update database to set logoPath to null
    await prisma.settings.update({
      where: { id: 'default' },
      data: { logoPath: null },
    })
    
    return NextResponse.json({
      ...settings,
      logoPath: null,
    })
  }

  return NextResponse.json(settings || {})
}

