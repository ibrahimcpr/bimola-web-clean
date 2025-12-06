'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface MapSectionProps {
  lat: number
  lng: number
  zoom: number
  address: string
}

export default function MapSection({ lat, lng, zoom, address }: MapSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Use OpenStreetMap embed URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary text-center mb-6">
            Konumumuz
          </h2>
          {address && (
            <div className="mb-6 text-center">
              <p className="text-lg text-gray-700">{address}</p>
            </div>
          )}
          <div className="h-96 rounded-lg overflow-hidden shadow-lg border-2 border-gray-200">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={mapUrl}
              className="w-full h-full"
              title="Bi Mola Konum"
            />
            <br />
            <small className="block text-center mt-2 text-gray-500">
              <a
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Daha büyük haritayı görüntüle
              </a>
            </small>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

