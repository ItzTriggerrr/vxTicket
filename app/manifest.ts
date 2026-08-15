import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'vxTicket – Events & Ticketing',
    short_name: 'vxTicket',
    description: 'Discover and buy tickets to the most trending and engaging events across Ghana.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#22c55e', // Your brand green or primary accent
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}