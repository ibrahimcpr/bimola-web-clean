import MenuViewer from '@/components/MenuViewer'
import { prisma } from '@/lib/prisma'

export default async function MenuPage() {
  const menu = await prisma.menu.findUnique({
    where: { id: 'default' },
  })

  return (
    <div className="min-h-screen py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary text-center mb-12">
          Menü
        </h1>
        <MenuViewer imagePath={menu?.imagePath || null} />
      </div>
    </div>
  )
}

