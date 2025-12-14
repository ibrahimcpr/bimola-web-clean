'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface GalleryImage {
  id: string
  path: string
  order: number
}

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/gallery')
      if (response.ok) {
        const data = await response.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file) {
      setMessage({ type: 'error', text: 'Lütfen bir dosya seçin' })
      setUploading(false)
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.' })
      setUploading(false)
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Geçersiz dosya tipi. Sadece JPG, PNG ve WebP formatları desteklenir.' })
      setUploading(false)
      return
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/gallery', {
        method: 'POST',
        body: uploadFormData,
      })

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      let data

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // If not JSON, try to get text response
        const text = await response.text()
        console.error('Non-JSON response:', text)
        setMessage({ type: 'error', text: `Sunucu hatası: ${response.status} ${response.statusText}` })
        setUploading(false)
        return
      }

      console.log('Upload response:', { status: response.status, data })

      if (response.ok) {
        // Check if upload was successful (either success flag or image object)
        if (data.success !== false && (data.success || data.image)) {
          setMessage({ type: 'success', text: 'Fotoğraf başarıyla yüklendi!' })
          if (e.currentTarget) {
            e.currentTarget.reset()
          }
          // Small delay to ensure file is written before refreshing
          setTimeout(() => {
            fetchImages()
          }, 300)
        } else {
          setMessage({ type: 'error', text: data.error || 'Yükleme başarısız' })
          console.error('Upload error:', data)
        }
      } else {
        setMessage({ type: 'error', text: data.error || `Yükleme başarısız: ${response.status} ${response.statusText}` })
        console.error('Upload error:', data)
      }
    } catch (error) {
      console.error('Upload exception:', error)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setMessage({ type: 'error', text: 'Sunucu yanıtı geçersiz. Lütfen tekrar deneyin.' })
      } else {
        setMessage({ type: 'error', text: `Bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` })
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/gallery?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Fotoğraf silindi!' })
        fetchImages()
      } else {
        setMessage({ type: 'error', text: 'Silme başarısız' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      const response = await fetch('/api/admin/gallery/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, direction }),
      })

      if (response.ok) {
        fetchImages()
      }
    } catch (error) {
      console.error('Reorder error:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Yükleniyor...</div>
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Yeni Fotoğraf Yükle</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
            />
          </div>
          <button
            type="submit"
            disabled={uploading}
            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h2 className="text-xl font-semibold mb-4">Galeri Fotoğrafları</h2>
        {images.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Henüz fotoğraf yüklenmedi.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="relative group border rounded-lg overflow-hidden"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={image.path}
                      alt={`Galeri ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handleReorder(image.id, 'up')}
                      disabled={index === 0}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white text-primary rounded hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleReorder(image.id, 'down')}
                      disabled={index === images.length - 1}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-white text-primary rounded hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDelete(image.id)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-all"
                    >
                      Sil
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    Sıra: {image.order}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}

