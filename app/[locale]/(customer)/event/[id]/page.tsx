import { Metadata } from "next";
import { prisma } from "../../../../../lib/prisma";
import { notFound } from "next/navigation";
import DynamicEventDetailsContainer from "./EventDetailsClient";

// 🧠 ISR CONFIGURATION: Revalidate the page at most once every 60 seconds
export const revalidate = 60; 

// Tell Next.js to dynamically generate static pages on demand as users visit them
export const dynamicParams = true;

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

// ─── 1. DYNAMIC OPENGRAPH & TWITTER PREVIEWS (SERVER EXPORT) ─────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;

  try {
    const event = await prisma.eventListing.findUnique({
      where: { id },
      select: {
        title: true,
        description: true,
        coverImage: true,
        venueName: true,
        city: true,
        address: true,
      },
    });

    if (!event) {
      return {
        title: "Event Not Found | vxTicket",
        description: "The requested event listing was not found on vxTicket.",
      };
    }

    const eventTitle = `${event.title} | vxTicket`;
    const eventImage = event.coverImage || "https://vxticket.com/icon.png";
    const cleanDescription = event.description
      ? event.description.slice(0, 160)
      : `Get tickets to ${event.title} happening at ${event.venueName || event.city || "Ghana"} on vxTicket.`;

    return {
      title: eventTitle,
      description: cleanDescription,
      openGraph: {
        title: eventTitle,
        description: cleanDescription,
        url: `https://vxticket.com/${locale || "en"}/event/${id}`,
        siteName: "vxTicket",
        type: "website",
        images: [
          {
            url: eventImage,
            width: 1200,
            height: 630,
            alt: event.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: eventTitle,
        description: cleanDescription,
        images: [eventImage],
      },
    };
  } catch (error) {
    console.error("Failed to generate OpenGraph metadata:", error);
    return {
      title: "Event Details | vxTicket",
      description: "Book tickets to top events across Ghana.",
    };
  }
}

// ─── 2. SERVER DATA LOADER & SERIALIZER ───────────────────────────────────────
export default async function EventPage({ params }: PageProps) {
  // Await the parameters cleanly for Next.js async boundary runtime safety
  const { id } = await params;

  try {
    const event = await prisma.eventListing.findUnique({
      where: { id },
      include: {
        ticketTiers: true,
        lineup: true,
      },
    });

    if (!event) {
      notFound();
    }

    // Explicitly destructure to strip out the un-serialized relational structures
    const { ticketTiers, lineup, ...pureEventFields } = event;

    // Serialize database models safely for Server-Client boundary transmission
    const serializedEvent = {
      ...pureEventFields,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate ? event.endDate.toISOString() : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
      tiers: ticketTiers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        price: t.price,
        capacity: t.capacity,
        isFree: t.isFree,
      })),
      lineup: lineup.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        imageUrl: a.imageUrl,
      })),
    };

    return <DynamicEventDetailsContainer initialEvent={serializedEvent} />;
  } catch (error) {
    console.error("ISR Static Generation Fallback Triggered:", error);
    throw error;
  }
}