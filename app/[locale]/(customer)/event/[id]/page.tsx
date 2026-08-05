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