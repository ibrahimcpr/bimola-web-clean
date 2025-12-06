import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const sessionId = await getSession()

    if (sessionId) {
      await deleteSession(sessionId)
    }

    const cookieStore = await cookies()
    cookieStore.delete('session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

