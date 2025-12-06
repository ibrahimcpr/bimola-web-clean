import SettingsForm from '@/components/admin/SettingsForm'
import { prisma } from '@/lib/prisma'

export default async function AdminDashboard() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Ana Sayfa Ayarları</h1>
      <SettingsForm settings={settings} />
    </div>
  )
}

