import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('LOGIN STEP 1 - request geldi')

    const body = await request.json().catch((err) => {
      console.error('LOGIN JSON PARSE ERROR:', err)
      return null
    })

    console.log('LOGIN STEP 2 - body:', body)

    if (!body || !body.email || !body.password) {
      console.log('LOGIN STOP - invalid body')
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, password } = body

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    console.log('LOGIN STEP 3 - env kontrol edildi', {
      hasAdminEmail: !!adminEmail,
      hasAdminPassword: !!adminPassword,
      requestEmail: email,
    })

    if (!adminEmail || !adminPassword) {
      console.log('LOGIN STOP - admin env eksik')
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 }
      )
    }

    if (email !== adminEmail) {
      console.log('LOGIN STOP - email yanlış')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isValid = password === adminPassword

    console.log('LOGIN STEP 4 - password kontrol edildi', {
      isValid,
    })

    if (!isValid) {
      console.log('LOGIN STOP - password yanlış')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('LOGIN STEP 5 - session oluşturulacak')

    const sessionId = await createSession()

    console.log('LOGIN STEP 6 - session oluştu')

    const cookieStore = cookies()

    console.log('LOGIN STEP 7 - cookie set edilecek')

    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    console.log('LOGIN STEP 8 - login success')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LOGIN CATCH ERROR:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}