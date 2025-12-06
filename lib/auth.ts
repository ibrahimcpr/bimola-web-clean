import { cookies } from 'next/headers'
import { prisma } from './prisma'
import crypto from 'crypto'

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function createSession(): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('hex')
  const id = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + SESSION_DURATION)

  await prisma.session.create({
    data: {
      id,
      sessionId,
      expiresAt,
    },
  })

  return sessionId
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value

  if (!sessionId) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { sessionId },
  })

  if (!session || session.expiresAt < new Date()) {
    // Session expired or doesn't exist
    if (session) {
      await prisma.session.delete({ where: { sessionId } })
    }
    return null
  }

  return sessionId
}

export async function deleteSession(sessionId: string) {
  await prisma.session.delete({
    where: { sessionId },
  })
}

export async function isAuthenticated(): Promise<boolean> {
  const sessionId = await getSession()
  return sessionId !== null
}

