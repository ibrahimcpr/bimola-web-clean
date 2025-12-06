'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'

interface IntroTextProps {
  text: string
}

export default function IntroText({ text }: IntroTextProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">
            Hoş Geldiniz
          </h2>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
            {text || 'Bi Mola, el açması gözleme ve mantısıyla sıcak ve samimi bir mola noktasıdır. Taze malzemelerle hazırlanan lezzetlerimizle sizleri bekliyoruz.'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}

