'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-sm"
          >
            © {currentYear} Bi Mola. Tüm hakları saklıdır.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex space-x-6"
          >
            <Link
              href="/menu"
              className="text-sm hover:text-secondary transition-colors duration-300"
            >
              Menü
            </Link>
            <Link
              href="/iletisim"
              className="text-sm hover:text-secondary transition-colors duration-300"
            >
              İletişim
            </Link>
          </motion.div>
        </div>
      </div>
    </footer>
  )
}

