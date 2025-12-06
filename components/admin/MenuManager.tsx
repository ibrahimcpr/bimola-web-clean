'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion } from 'framer-motion'

interface Menu {
  id: string
  imagePath: string | null
}

export default function MenuManager() {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchMenu = async () => {
    try {
      const response = await fetch('/api/admin/menu')
      if (response.ok) {
        const data = await response.json()
        setMenu(data)
      }
    } catch (error) {
      console.error('Error fetching menu:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMenu()
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

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Menü görseli başarıyla yüklendi!' })
        e.currentTarget.reset()
        fetchMenu()
      } else {
        setMessage({ type: 'error', text: data.error || 'Yükleme başarısız' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setUploading(false)
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
        <h2 className="text-xl font-semibold mb-4">Menü Görseli Yükle (JPEG)</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/jpg"
              required
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
            />
            <p className="mt-2 text-sm text-gray-500">Sadece JPEG formatı kabul edilir.</p>
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

      {menu?.imagePath && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Aktif Menü</h2>
          <div className="space-y-4">
            <p className="text-gray-600">
              Mevcut menü görseli: <span className="font-medium">{menu.imagePath}</span>
            </p>
            <div className="mt-4">
              <img
                src={menu.imagePath}
                alt="Aktif Menü"
                className="max-w-full h-auto rounded-lg border border-gray-200"
                style={{ maxHeight: '400px' }}
              />
            </div>
            <a
              href={menu.imagePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-secondary text-white rounded-md hover:bg-opacity-90 transition-all duration-200"
            >
              Menüyü Görüntüle
            </a>
          </div>
        </motion.div>
      )}
    </div>
  )
}

