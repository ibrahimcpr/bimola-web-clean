import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { prisma } from '@/lib/prisma'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Bi Mola - El Açması Gözleme ve Mantı',
  description: 'Bi Mola, el açması gözleme ve mantısıyla sıcak ve samimi bir mola noktasıdır.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

        const logoPath = settings?.logoPath || null

        return (
          <html lang="tr">
            <head>
              {logoPath && (
                <>
                  <link rel="icon" href={logoPath} />
                  <link rel="apple-touch-icon" href={logoPath} />
                </>
              )}
            </head>
      <body className={inter.className}>
        <Navigation />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

