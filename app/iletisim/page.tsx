import ContactInfo from '@/components/ContactInfo'
import { prisma } from '@/lib/prisma'

export default async function ContactPage() {
  const contact = await prisma.contact.findUnique({
    where: { id: 'default' },
  })

  return (
    <div className="min-h-screen py-16 md:py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary text-center mb-12">
          İletişim
        </h1>
        <ContactInfo contact={contact} />
      </div>
    </div>
  )
}

