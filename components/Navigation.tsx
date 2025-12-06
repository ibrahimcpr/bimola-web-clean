'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [logoPath, setLogoPath] = useState('/logo.svg')
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now())

  useEffect(() => {
    // Fetch logo path from settings immediately
    const fetchLogo = async () => {
      try {
        const timestamp = Date.now()
        const res = await fetch(`/api/settings?t=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        })
        const data = await res.json()
        console.log('Fetched logo path:', data.logoPath)
        if (data.logoPath) {
          setLogoPath(data.logoPath)
          setLogoTimestamp(timestamp) // Update timestamp to force refresh
        }
      } catch (error) {
        console.error('Error fetching logo:', error)
      }
    }
    
    // Fetch immediately on mount
    fetchLogo()
    
    // Refresh logo every 3 seconds in case it was updated
    const interval = setInterval(() => {
      fetchLogo()
    }, 3000)
    
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { href: '/', label: 'Ana Sayfa' },
    { href: '/menu', label: 'Menü' },
    { href: '/iletisim', label: 'İletişim' },
  ]

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-16 h-16"
            >
              <img
                key={logoTimestamp}
                src={`${logoPath}?t=${logoTimestamp}`}
                alt="Bi Mola Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  console.error('Logo load error, falling back to placeholder:', logoPath)
                  e.currentTarget.src = '/logo-placeholder.svg'
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully:', logoPath)
                }}
              />
            </motion.div>
            <span className="text-2xl font-bold text-primary">Bi Mola</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative text-gray-700 hover:text-primary transition-colors duration-300 font-medium group"
              >
                {item.label}
                <motion.span
                  className="absolute bottom-0 left-0 w-0 h-0.5 bg-secondary group-hover:w-full transition-all duration-300"
                  initial={false}
                />
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-primary focus:outline-none"
            aria-label="Toggle menu"
          >
            <motion.div
              animate={isOpen ? 'open' : 'closed'}
              className="w-6 h-6 flex flex-col justify-center space-y-1.5"
            >
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: 45, y: 8 },
                }}
                className="w-full h-0.5 bg-primary origin-center transition-all"
              />
              <motion.span
                variants={{
                  closed: { opacity: 1 },
                  open: { opacity: 0 },
                }}
                className="w-full h-0.5 bg-primary transition-all"
              />
              <motion.span
                variants={{
                  closed: { rotate: 0, y: 0 },
                  open: { rotate: -45, y: -8 },
                }}
                className="w-full h-0.5 bg-primary origin-center transition-all"
              />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-gray-700 hover:text-primary transition-colors duration-300 font-medium py-2"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

