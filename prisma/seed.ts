import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

import { randomUUID } from 'crypto'

async function main() {
  // Create default settings
  await prisma.settings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      introText: 'Bi Mola, el açması gözleme ve mantısıyla sıcak ve samimi bir mola noktasıdır. Taze malzemelerle hazırlanan lezzetlerimizle sizleri bekliyoruz.',
      youtubeUrl: '',
      mapLat: 41.0082,
      mapLng: 28.9784,
      mapZoom: 15,
      addressText: '',
      logoPath: null,
    },
  })

  // Create default menu entry
  await prisma.menu.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      imagePath: null,
    },
  })

  // Create default contact entry
  await prisma.contact.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      phone: '',
      address: '',
      instagram: '',
      tiktok: '',
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

