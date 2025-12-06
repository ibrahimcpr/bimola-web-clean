import ContactForm from '@/components/admin/ContactForm'
import { prisma } from '@/lib/prisma'

export default async function AdminContact() {
  const contact = await prisma.contact.findUnique({
    where: { id: 'default' },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">İletişim Bilgileri</h1>
      <ContactForm contact={contact} />
    </div>
  )
}

