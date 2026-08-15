import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://vxticket.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard/', '/vendor/', '/admin/'], // Protect private vendor & admin portals
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
