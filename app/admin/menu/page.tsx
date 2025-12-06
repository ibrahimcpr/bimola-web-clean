import MenuManager from '@/components/admin/MenuManager'

export default async function AdminMenu() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Menü PDF Yönetimi</h1>
      <MenuManager />
    </div>
  )
}

