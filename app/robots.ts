import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/*',
        '/api/*',
        '/private/*',
      ],
    },
    sitemap: 'https://digitalutopia.app/sitemap.xml',
  }
} 