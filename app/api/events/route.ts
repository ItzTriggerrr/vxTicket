import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. POST: SAVE A NEW EVENT & RELATIONAL DATA
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ADDED 'host' to the destructured variables below
    const { 
      providerId, title, description, startDate, startTime, endTime, 
      venueName, address, city, category, totalCapacity, coverImage,
      ticketTiers, lineup, host 
    } = body;

    // 🛡️ BULLETPROOFING: Filter out empty rows if the Provider left them blank
    const validTickets = ticketTiers?.filter((tier: any) => tier.name !== "") || [];
    const validLineup = lineup?.filter((artist: any) => artist.name !== "") || [];

    const newEvent = await prisma.eventListing.create({
      data: {
        providerId,
        title,
        description,
        coverImage,
        // BULLETPROOFED: Prevents "Invalid Date" crashes
        startDate: startDate ? new Date(startDate) : new Date(), 
        startTime,
        endTime,
        venueName,
        address,
        city,
        category,
        host, // <-- Now properly saving to Prisma/Supabase!
        totalCapacity: parseInt(totalCapacity) || 0, 
        
        ticketTiers: {
          create: validTickets.map((tier: any) => ({
            name: tier.name,
            price: parseFloat(tier.price) || 0,
            capacity: parseInt(tier.capacity) || 0,
            description: tier.description || ""
          }))
        },
        lineup: {
          create: validLineup.map((artist: any) => ({
            name: artist.name,
            role: artist.role || ""
          }))
        }
      },
    });

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (error: any) {
    // This will print the EXACT reason in the terminal if it ever fails again
    console.error("🔥 Prisma Error:", error.message);
    return NextResponse.json({ success: false, error: "Database save failed." }, { status: 500 });
  }
}
// 2. GET: FETCH EVENTS FROM THE DATABASE
// ==========================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ success: false, error: "Provider ID is required." }, { status: 400 });
    }

    const events = await prisma.eventListing.findMany({
      where: { providerId: providerId },
      orderBy: { startDate: 'asc' } 
    });

    return NextResponse.json({ success: true, events }, { status: 200 });
  } catch (error) {
    console.error("FIREWALL - Error fetching events:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch events." }, { status: 500 });
  }
}
// ==========================================
// 3. DELETE: REMOVE AN EVENT FROM THE DATABASE
// ==========================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({ success: false, error: "Event ID is required." }, { status: 400 });
    }

    // Tell Prisma to find the exact event and wipe it from Supabase
    await prisma.eventListing.delete({
      where: { id: eventId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("FIREWALL - Error deleting event:", error);
    return NextResponse.json({ success: false, error: "Failed to delete event." }, { status: 500 });
  }
}
// ==========================================
// 4. PUT: UPDATE AN EXISTING EVENT
// ==========================================
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, description, startDate, startTime, endTime, venueName, address, city, category, totalCapacity } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Event ID is required." }, { status: 400 });
    }

    // Tell Prisma to find the exact event by ID and overwrite its data
    const updatedEvent = await prisma.eventListing.update({
      where: { id: id },
      data: {
        title,
        description,
        startDate: startDate ? new Date(startDate) : new Date(), 
        startTime,
        endTime,
        venueName,
        address,
        city,
        category,
        totalCapacity: parseInt(totalCapacity), 
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent }, { status: 200 });
  } catch (error) {
    console.error("FIREWALL - Error updating event:", error);
    return NextResponse.json({ success: false, error: "Failed to update event." }, { status: 500 });
  }
}

