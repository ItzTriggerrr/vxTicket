import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// GET: FETCH A SINGLE EVENT & ITS RELATIONS
// ==========================================
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const event = await prisma.eventListing.findUnique({
      where: { id: id },
      // 🚀 THIS IS THE MAGIC: We tell Prisma to bring the related tables with it!
      include: {
        ticketTiers: true,
        lineup: true,
      }
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, event }, { status: 200 });
  } catch (error) {
    console.error("Error fetching single event:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch event details." }, { status: 500 });
  }
}