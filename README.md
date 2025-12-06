# Bi Mola Website

Modern, production-ready website for Bi Mola restaurant/café built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

- 🎨 Modern, responsive design with brand colors (#582b76 primary, #e3a52d secondary)
- 🖼️ Image gallery slider on homepage with admin management
- 📄 PDF menu viewer
- 🗺️ Interactive map using OpenStreetMap
- 📹 YouTube video embedding
- 🔐 Secure admin panel with session-based authentication
- ✨ Smooth animations using Framer Motion
- 🇹🇷 Turkish UI labels throughout

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Animations**: Framer Motion
- **Maps**: React Leaflet with OpenStreetMap
- **Authentication**: Server-side sessions with HttpOnly cookies

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

## Installation

1. **Clone the repository** (or navigate to the project directory)

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**:
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="file:./bimola.db"
   ADMIN_EMAIL="admin@bimola.com"
   ADMIN_PASSWORD="your-secure-password-here"
   ```
   
   **Important**: Change `ADMIN_EMAIL` and `ADMIN_PASSWORD` to your desired admin credentials before running in production!

4. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```
   
   This will:
   - Generate the Prisma client
   - Create the database file (`bimola.db`)
   - Seed initial data (default settings, menu, contact entries)

5. **Create upload directories**:
   ```bash
   mkdir -p public/uploads/gallery
   mkdir -p public/uploads/menu
   ```

## Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Admin Panel

Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

You'll be redirected to `/admin/login` if not authenticated. Use the credentials from your `.env` file.

## Building for Production

1. **Build the application**:
   ```bash
   npm run build
   # or
   yarn build
   # or
   pnpm build
   ```

2. **Start the production server**:
   ```bash
   npm start
   # or
   yarn start
   # or
   pnpm start
   ```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./bimola.db` |
| `ADMIN_EMAIL` | Admin login email | `admin@bimola.com` |
| `ADMIN_PASSWORD` | Admin login password | `your-secure-password` |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: For Vercel, you may need to use a different database (PostgreSQL) or use Vercel's file system
   - `ADMIN_EMAIL`: Your admin email
   - `ADMIN_PASSWORD`: Your admin password
4. Deploy!

**Note**: Vercel uses a read-only file system, so SQLite won't work directly. Consider using:
- Vercel Postgres (free tier available)
- Or use a file-based database service
- Or deploy to a platform that supports SQLite (see below)

### Other Platforms

For platforms that support SQLite (like Railway, Render, or a VPS):

1. **Set up environment variables** on your hosting platform
2. **Run database migrations**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```
3. **Build and start**:
   ```bash
   npm run build
   npm start
   ```

### Docker (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── iletisim/         # Contact page
│   ├── menu/              # Menu page
│   └── page.tsx           # Homepage
├── components/            # React components
│   └── admin/            # Admin components
├── lib/                   # Utility functions
│   ├── auth.ts           # Authentication helpers
│   └── prisma.ts         # Prisma client
├── prisma/               # Prisma schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seed script
├── public/               # Static files
│   ├── uploads/          # User-uploaded files (gitignored)
│   └── logo-placeholder.svg
└── middleware.ts         # Next.js middleware for auth
```

## Admin Panel Features

### Ana Sayfa Ayarları (Homepage Settings)
- Edit intro text
- Set YouTube video URL
- Configure map location (latitude, longitude, zoom)
- Set address text

### Galeri Yönetimi (Gallery Management)
- Upload images (JPG, PNG, WebP)
- Delete images
- Reorder images (up/down buttons)
- Images are stored in `/public/uploads/gallery`

### Menü Yönetimi (Menu Management)
- Upload PDF menu
- Replace existing menu
- Menu is stored in `/public/uploads/menu`

### İletişim Bilgileri (Contact Information)
- Edit phone number
- Edit address
- Edit Instagram username/URL
- Edit TikTok username/URL

## Customization

### Logo

Replace `/public/logo-placeholder.svg` with your logo file. Supported formats: SVG, PNG, JPG.

The logo is used in:
- Navigation bar (left side)
- Browser favicon

### Colors

Edit `tailwind.config.ts` to change brand colors:

```typescript
colors: {
  primary: '#582b76',    // Your primary color
  secondary: '#e3a52d',  // Your secondary color
}
```

### Database

The database schema is defined in `prisma/schema.prisma`. To modify:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to regenerate the client

## Troubleshooting

### Database errors

If you see database errors:
1. Delete `bimola.db` and `bimola.db-journal` files
2. Run `npx prisma db push` again
3. Run `npm run db:seed`

### Upload errors

Make sure the upload directories exist:
```bash
mkdir -p public/uploads/gallery
mkdir -p public/uploads/menu
```

### Authentication issues

- Check that `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`
- Clear browser cookies and try logging in again
- Check that sessions are being created in the database

## License

This project is proprietary software for Bi Mola restaurant.

## Support

For issues or questions, please contact the development team.

