import HeroSlider from '@/components/HeroSlider'
import IntroText from '@/components/IntroText'
import YouTubeVideo from '@/components/YouTubeVideo'
import MapSection from '@/components/MapSection'
import { prisma } from '@/lib/prisma'

export default async function HomePage() {
  const settings = await prisma.settings.findUnique({
    where: { id: 'default' },
  })

  const galleryImages = await prisma.galleryImage.findMany({
    orderBy: { order: 'asc' },
  })

  return (
    <div className="min-h-screen">
      <HeroSlider images={galleryImages} />
      <IntroText text={settings?.introText || ''} />
      <YouTubeVideo url={settings?.youtubeUrl || ''} />
      <MapSection
        lat={settings?.mapLat || 41.0082}
        lng={settings?.mapLng || 28.9784}
        zoom={settings?.mapZoom || 15}
        address={settings?.addressText || ''}
      />
    </div>
  )
}

