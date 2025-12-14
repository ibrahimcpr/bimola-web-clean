'use client'

import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'

interface Settings {
  id: string
  introText: string
  youtubeUrl: string | null
  mapLat: number | null
  mapLng: number | null
  mapZoom: number
  addressText: string | null
  logoPath: string | null
}

interface SettingsFormProps {
  settings: Settings | null
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const [formData, setFormData] = useState({
    introText: settings?.introText || '',
    youtubeUrl: settings?.youtubeUrl || '',
    mapLat: settings?.mapLat?.toString() || '41.0082',
    mapLng: settings?.mapLng?.toString() || '28.9784',
    mapZoom: settings?.mapZoom?.toString() || '15',
    addressText: settings?.addressText || '',
  })
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [logoPath, setLogoPath] = useState(settings?.logoPath || '/logo.svg')

  const handleLogoUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Double check - prevent any default behavior
    if (e.defaultPrevented) {
      console.log('Event already prevented')
    }
    
    setUploadingLogo(true)
    setMessage(null)

    // Get file from input element directly
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement
    if (!fileInput) {
      console.error('File input not found!')
      setMessage({ type: 'error', text: 'Form hatası - sayfayı yenileyin' })
      setUploadingLogo(false)
      return
    }
    
    const file = fileInput.files?.[0]

    console.log('Logo upload form submitted')
    console.log('File from input:', file ? { name: file.name, type: file.type, size: file.size } : 'null')

    if (!file || file.size === 0) {
      const errorMsg = !file ? 'Lütfen bir dosya seçin' : 'Dosya boş görünüyor'
      setMessage({ type: 'error', text: errorMsg })
      setUploadingLogo(false)
      console.error('No file selected or file is empty')
      return false
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Dosya boyutu çok büyük. Maksimum 10MB olmalıdır.' })
      setUploadingLogo(false)
      return false
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Geçersiz dosya tipi. Sadece JPG, PNG, SVG ve WebP formatları desteklenir.' })
      setUploadingLogo(false)
      return false
    }

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)

      console.log('Sending POST request to /api/admin/logo')
      const response = await fetch('/api/admin/logo', {
        method: 'POST',
        body: uploadFormData,
      })
      
      console.log('Response status:', response.status)

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
        setUploadingLogo(false)
        return
      }

      console.log('Logo upload response:', { status: response.status, data })

      if (response.ok && data.success) {
        const newLogoPath = data.logoPath
        setLogoPath(newLogoPath)
        setMessage({ type: 'success', text: `Logo başarıyla yüklendi!` })
        if (e.currentTarget) {
          e.currentTarget.reset()
        }
        console.log('Logo uploaded successfully:', newLogoPath)
        
        // Force refresh of all pages after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        const errorMsg = data.error || 'Logo yükleme başarısız'
        setMessage({ type: 'error', text: errorMsg })
        console.error('Logo upload failed:', errorMsg)
      }
    } catch (error) {
      console.error('Logo upload exception:', error)
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        setMessage({ type: 'error', text: 'Sunucu yanıtı geçersiz. Lütfen tekrar deneyin.' })
      } else {
        setMessage({ type: 'error', text: `Bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}` })
      }
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          introText: formData.introText,
          youtubeUrl: formData.youtubeUrl,
          mapLat: parseFloat(formData.mapLat),
          mapLng: parseFloat(formData.mapLng),
          mapZoom: parseInt(formData.mapZoom),
          addressText: formData.addressText,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ayarlar başarıyla kaydedildi!' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Bir hata oluştu' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* Logo Upload Section */}
        <div className="border-b pb-6">
          <h3 className="text-lg font-semibold mb-4">Logo Yükle</h3>
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <img
                src={`${logoPath}?t=${Date.now()}`}
                alt="Logo"
                className="w-24 h-24 object-contain border border-gray-200 rounded-lg p-2"
                onError={(e) => {
                  // Try default logo first, then placeholder
                  if (e.currentTarget.src.includes('logo-placeholder')) {
                    return // Already tried placeholder
                  }
                  if (e.currentTarget.src.includes('/logo.svg') || e.currentTarget.src.includes('blob')) {
                    e.currentTarget.src = '/logo.svg'
                  } else {
                    e.currentTarget.src = '/logo-placeholder.svg'
                  }
                }}
              />
              <p className="text-xs text-gray-500 mt-1 text-center max-w-24 truncate">
                {logoPath.replace('/uploads/logo/', '')}
              </p>
            </div>
            <div className="flex-1">
              <form 
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleLogoUpload(e)
                }} 
                encType="multipart/form-data" 
                className="space-y-3"
                action="#"
                method="post"
              >
                <div>
                  <input
                    type="file"
                    id="logo-upload"
                    name="logo"
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-opacity-90"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        console.log('File selected:', { name: file.name, type: file.type, size: file.size })
                      }
                    }}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    PNG, JPG, SVG veya WebP formatında logo yükleyebilirsiniz.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={uploadingLogo}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {uploadingLogo ? 'Yükleniyor...' : 'Logo Yükle'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="introText" className="block text-sm font-medium text-gray-700 mb-2">
            Tanıtım Metni
          </label>
          <textarea
            id="introText"
            value={formData.introText}
            onChange={(e) => setFormData({ ...formData, introText: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 mb-2">
            YouTube Video URL
          </label>
          <input
            id="youtubeUrl"
            type="url"
            value={formData.youtubeUrl}
            onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="mapLat" className="block text-sm font-medium text-gray-700 mb-2">
              Enlem (Latitude)
            </label>
            <input
              id="mapLat"
              type="number"
              step="any"
              value={formData.mapLat}
              onChange={(e) => setFormData({ ...formData, mapLat: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="mapLng" className="block text-sm font-medium text-gray-700 mb-2">
              Boylam (Longitude)
            </label>
            <input
              id="mapLng"
              type="number"
              step="any"
              value={formData.mapLng}
              onChange={(e) => setFormData({ ...formData, mapLng: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
          <div>
            <label htmlFor="mapZoom" className="block text-sm font-medium text-gray-700 mb-2">
              Zoom Seviyesi
            </label>
            <input
              id="mapZoom"
              type="number"
              min="1"
              max="20"
              value={formData.mapZoom}
              onChange={(e) => setFormData({ ...formData, mapZoom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="addressText" className="block text-sm font-medium text-gray-700 mb-2">
            Adres Metni
          </label>
          <input
            id="addressText"
            type="text"
            value={formData.addressText}
            onChange={(e) => setFormData({ ...formData, addressText: e.target.value })}
            placeholder="Örn: İstanbul, Türkiye"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </form>
    </motion.div>
  )
}

