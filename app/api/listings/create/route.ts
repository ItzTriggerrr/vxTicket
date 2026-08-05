import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Inline security sanitization helpers to eliminate missing module path imports
function sanitizeTextInput(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return "";
  return input.trim().slice(0, maxLength);
}

function sanitizeCurrencyInput(input: string, maxAmount: number): number {
  const numericVal = parseFloat(input);
  if (isNaN(numericVal) || numericVal < 0) return 0;
  return Math.min(numericVal, maxAmount);
}

export async function POST(request: Request) {
  try {
    const rawData = await request.json();

    // 🛡️ CRUSH-PROOF LAYER: Sanitize and enforce maximum character constraints
    const cleanTitle = sanitizeTextInput(rawData.title || rawData.names?.en || "", 80);
    const cleanVenue = sanitizeTextInput(rawData.venueName || rawData.location?.address || "", 120);
    const cleanCity = sanitizeTextInput(rawData.city || "Accra", 50);

    // 🧬 Write validated parameters straight to PostgreSQL tables mapping your Prisma schema rules
    const deployedListing = await prisma.eventListing.create({
      data: {
        title: cleanTitle || "Untitled Event",
        description: sanitizeTextInput(rawData.description || rawData.descriptions?.en || "", 1000),
        category: rawData.category || "OTHER",
        startDate: rawData.startDate ? new Date(rawData.startDate) : new Date(),
        endDate: rawData.endDate ? new Date(rawData.endDate) : null,
        startTime: rawData.startTime || null,
        endTime: rawData.endTime || null,
        venueName: cleanVenue || "TBD Venue",
        address: cleanVenue,
        city: cleanCity,
        coverImage: rawData.coverImage || null,
        status: rawData.status || "PUBLISHED",
        provider: {
          connect: { id: rawData.providerId }
        }
      }
    });

    return NextResponse.json({ success: true, listingId: deployedListing.id }, { status: 201 });

  } catch (error: any) {
    console.error("Database Transaction Abort Logged:", error);
    return NextResponse.json(
      { success: false, error: error.message || "System transaction fault processing payload structure" },
      { status: 500 }
    );
  }
}