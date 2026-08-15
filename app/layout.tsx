import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AuthProvider } from "../shared/context/AuthContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://vxticket.com"),
  title: {
    default: "vxTicket – Ghana's Leading Event Management & Ticketing Platform",
    template: "%s | vxTicket",
  },
  description:
    "Discover and buy tickets to the hottest concerts, festivals, parties, and corporate events across Ghana with instant, secure delivery.",
  keywords: [
    "vxTicket",
    "buy tickets online ghana",
    "ghana events",
    "accra concerts",
    "event management platform ghana",
    "party tickets ghana",
    "e-tickets ghana",
  ],
  verification: {
    google: "ubBbpI0jKWf75k0dsPmdp6DVWyqwO8h7fWm9hy-sUm0",
  },
  authors: [{ name: "vxTicket" }],
  creator: "vxTicket",
  publisher: "vxTicket",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "vxTicket – Ghana's best Event Management & Ticketing Platform",
    description:
      "Discover and buy tickets to the most thrilling concerts, festivals, parties, and corporate events across Ghana with instant, secure delivery.",
    url: "https://vxticket.com",
    siteName: "vxTicket",
    locale: "en_GH",
    type: "website",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "vxTicket Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "vxTicket – Ghana's Leading Event Management & Ticketing Platform",
    description:
      "Discover and buy tickets to the most thrilling concerts, festivals, parties, and corporate events across Ghana.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* We wrap the entire app in AuthProvider so state survives page navigations */}
        <AuthProvider>
          <ChakraProvider>
            {children}
          </ChakraProvider>
        </AuthProvider>
      </body>
    </html>
  );
}