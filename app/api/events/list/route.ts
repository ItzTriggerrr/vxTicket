export const dynamic = "force-dynamic";
// src/app/api/events/list/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch all events, newest first, and include the provider's business details
    const events = await prisma.eventListing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        provider: {
          include: {
            providerProfile: true // Grabs their business name and logo!
          }
        }
      }
    });

    return NextResponse.json({ success: true, events }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch events:", error.message);
    return NextResponse.json({ success: false, error: "Failed to load events" }, { status: 500 });
  }
}