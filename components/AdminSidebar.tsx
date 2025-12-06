'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { href: '/admin', label: 'Ana Sayfa Ayarları', icon: '🏠' },
    { href: '/admin/gallery', label: 'Galeri', icon: '🖼️' },
    { href: '/admin/menu', label: 'Menü', icon: '📄' },
    { href: '/admin/contact', label: 'İletişim', icon: '📞' },
  ]

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-primary">Bi Mola Admin</h1>
      </div>
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Çıkış Yap</span>
        </button>
      </nav>
    </aside>
  )
}

