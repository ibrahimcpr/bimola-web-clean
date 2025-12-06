import GalleryManager from '@/components/admin/GalleryManager'

export default async function AdminGallery() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Galeri Yönetimi</h1>
      <GalleryManager />
    </div>
  )
}

