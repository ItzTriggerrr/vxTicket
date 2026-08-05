export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

function getBase64SizeInMB(base64String: string): number {
  if (!base64String) return 0;
  const base64Content = base64String.split(",")[1] || base64String;
  const sizeInBytes = (base64Content.length * 3) / 4;
  return sizeInBytes / (1024 * 1024);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // ─── SCENARIO A: SINGLE EVENT DETAILS VIEW ───────────────────────────
    if (id) {
      const event = await prisma.eventListing.findUnique({
        where: { id },
        include: {
          ticketTiers: true,
          lineup: true,
        },
      });

      if (!event) {
        return NextResponse.json({ error: "Event listing not discovered." }, { status: 404 });
      }

      const formattedEvent = {
        ...event,
        tiers: event.ticketTiers,
      };

      return NextResponse.json({ success: true, event: formattedEvent }, { status: 200 });
    }

    // ─── SCENARIO B: LIGHTWEIGHT HIGH-SPEED FEED INVENTORY ─────────────────
    const now = new Date();

    const eventsRaw = await prisma.eventListing.findMany({
      where: { 
        status: "PUBLISHED",
        OR: [
          { endDate: { gte: now } },
          { endDate: null, startDate: { gte: now } }
        ]
      },
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        title: true,
        category: true,
        startDate: true,
        endDate: true,
        startTime: true,
        venueName: true,
        city: true,
        coverImage: true,
        status: true,
        isHero: true,
        isFeatured: true,
        isPopular: true,
        ticketTiers: {
          select: {
            id: true,
            name: true,
            price: true,
            capacity: true,
            sold: true,
            isFree: true,
          },
        },
      },
    });

    const eventsWithTiers = eventsRaw.map((event) => ({
      ...event,
      tiers: event.ticketTiers,
    }));

    // 1. Hero Event: EXCLUSIVELY events where you set isHero = true (Null if none toggled)
    const heroEvent = eventsWithTiers.find((e: any) => e.isHero === true) || null;
    
    // 2. Featured Events: Automatic top 4 upcoming events (chronological order)
    const featuredEvents = [...eventsWithTiers].slice(0, 4);

    // 3. Made for You (Popular / All): Full collection of all published events
    const popularEvents = eventsWithTiers;

    return NextResponse.json(
      { 
        success: true, 
        hero: heroEvent,
        featured: featuredEvents,
        popular: popularEvents,
        all: eventsWithTiers 
      }, 
      { 
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59"
        }
      }
    );

  } catch (error: any) {
    console.error("❌ Feed intelligence compilation fault:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST HANDLER FOR UPDATING & CREATING LISTINGS ─────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      providerId,
      title,
      description,
      category,
      startDate,
      endDate,
      startTime,
      endTime,
      venueName,
      address,
      city,
      coverImage,
      gallery,
      status,
      tiers,
      lineup,       
      host,         
      customField1  
    } = body;

    if (!providerId) {
      return NextResponse.json({ error: "Authentication Missing." }, { status: 400 });
    }

    const MAX_IMAGE_SIZE_MB = 4.0;

    if (coverImage) {
      const coverSize = getBase64SizeInMB(coverImage);
      if (coverSize > MAX_IMAGE_SIZE_MB) {
        return NextResponse.json(
          { error: `The primary cover flyer is too large (${coverSize.toFixed(2)}MB). To prevent connection drops, please upload an image under ${MAX_IMAGE_SIZE_MB}MB.` },
          { status: 413 }
        );
      }
    }

    if (gallery && Array.isArray(gallery)) {
      for (let i = 0; i < gallery.length; i++) {
        const img = gallery[i];
        if (img) {
          const gallerySize = getBase64SizeInMB(img);
          if (gallerySize > MAX_IMAGE_SIZE_MB) {
            return NextResponse.json(
              { error: `Gallery image #${i + 1} is too large (${gallerySize.toFixed(2)}MB). To prevent connection drops, please upload images under ${MAX_IMAGE_SIZE_MB}MB.` },
              { status: 413 }
            );
          }
        }
      }
    }

    const userExists = await prisma.user.findUnique({ where: { id: providerId }, select: { id: true } });
    if (!userExists) {
      return NextResponse.json({ error: "Stale user session profile reference." }, { status: 444 });
    }

    const parseIncomingDate = (dateVal: any) => {
      if (!dateVal || dateVal === "Unset") return null;
      const parsed = new Date(dateVal);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    let eventListing;
    let existingRecord = id ? await prisma.eventListing.findUnique({ where: { id }, select: { id: true } }) : null;

    const formattedCategory = category ? category.trim() : "OTHER";

    if (id && existingRecord) {
      eventListing = await prisma.eventListing.update({
        where: { id },
        data: {
          title,
          description,
          category: formattedCategory,
          startDate: (parseIncomingDate(startDate) || new Date()) as any,
          endDate: parseIncomingDate(endDate) as any,
          startTime,
          endTime,
          venueName,
          address,
          city,
          coverImage,
          gallery,
          status,
          host,
          customField1,
          provider: { connect: { id: providerId } }
        },
      });

      await prisma.ticketTier.deleteMany({ where: { eventId: id } });
      await prisma.artist.deleteMany({ where: { eventId: id } });
    } else {
      eventListing = await prisma.eventListing.create({
        data: {
          title,
          description,
          category: formattedCategory,
          startDate: (parseIncomingDate(startDate) || new Date()) as any,
          endDate: parseIncomingDate(endDate) as any,
          startTime,
          endTime,
          venueName,
          address,
          city,
          coverImage,
          gallery,
          status,
          host,
          customField1,
          provider: { connect: { id: providerId } }
        },
      });
    }

    if (tiers && Array.isArray(tiers) && tiers.length > 0) {
      await prisma.ticketTier.createMany({
        data: tiers.map((tier: any) => ({
          eventId: eventListing.id,
          name: tier.name || "Standard Admission",
          price: tier.isFree ? 0 : parseFloat(tier.price) || 0,
          capacity: parseInt(tier.capacity) || 0,
          isFree: tier.isFree || false,
          description: tier.description || null
         })),
      });
    }

    if (lineup && Array.isArray(lineup) && lineup.length > 0) {
      await prisma.artist.createMany({
        data: lineup.map((performer: any) => ({
          eventId: eventListing.id,
          name: performer.name || "Special Guest",
          role: performer.role || null
        })),
      });
    }

    return NextResponse.json({ success: true, event: eventListing }, { status: 200 });
  } catch (error: any) {
    console.error("❌ vxTicket Backend Manager Pipeline Exception:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}