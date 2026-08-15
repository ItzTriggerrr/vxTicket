import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma'; // Adjust path if your prisma client is in lib/prisma or lib/db

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://vxticket.com';

  // 1. Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // 2. Dynamic public event listings from database
  try {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000,
    });

    const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${baseUrl}/events/${event.id}`,
      lastModified: event.updatedAt ? new Date(event.updatedAt) : new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticRoutes, ...eventRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
    return staticRoutes;
  }
}