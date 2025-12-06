'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface GalleryImage {
  id: string
  path: string
  order: number
}

interface HeroSliderProps {
  images: GalleryImage[]
}

export default function HeroSlider({ images }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [images.length])

  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="h-[60vh] md:h-[80vh] bg-gray-100 flex items-center justify-center"
      >
        <p className="text-gray-500 text-lg">Henüz fotoğraf eklenmedi.</p>
      </motion.div>
    )
  }

  return (
    <div className="relative h-[60vh] md:h-[80vh] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          {images[currentIndex].path.startsWith('http') ? (
            <img
              src={images[currentIndex].path}
              alt={`Galeri ${currentIndex + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setIsLoaded(true)}
              onError={(e) => {
                console.error('Failed to load gallery image:', images[currentIndex].path)
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <Image
              src={images[currentIndex].path}
              alt={`Galeri ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              onLoad={() => setIsLoaded(true)}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-secondary w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

