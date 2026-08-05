import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Force Next.js to bypass internal build caching and read fresh Supabase tables
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId || providerId === "null" || providerId === "undefined") {
      return NextResponse.json(
        { error: "Authorization token invalid or missing." },
        { status: 400 }
      );
    }

    // 1. Fetch real listings assigned to this explicit provider ID from Supabase
    const listings = await prisma.eventListing.findMany({
      where: { providerId: providerId },
      orderBy: { createdAt: "desc" },
    });

    if (!listings || listings.length === 0) {
      return NextResponse.json({ events: [] }, { status: 200 });
    }

    // 2. Dynamically compile transaction metrics for existing listings
    const calculatedEvents = await Promise.all(
      listings.map(async (event) => {
        const tiers = await prisma.ticketTier.findMany({
          where: { eventId: event.id },
        });

        // Query orders with flexible status matching (Paystack + local statuses)
        const successfulOrders = await prisma.ticketOrder.findMany({
          where: { 
            eventId: event.id, 
            status: { 
              in: [
                "SUCCESSFUL", "Successful", "success", "SUCCESS", 
                "Paid", "paid", "PAID", 
                "Pending", "Free"
              ] 
            } 
          },
        });

        const formattedTiers = tiers.map((tier) => {
          // Stripped casing and trailing spaces so order tier name matches the ticket tier name identically
          const matchingOrdersForTier = successfulOrders.filter((o: any) => {
            const orderTierName = (o.ticketTierName || o.ticketTier || "").trim().toUpperCase();
            const currentTierName = (tier.name || "").trim().toUpperCase();
            return orderTierName === currentTierName;
          });
          
          return {
            name: tier.name,
            price: Number(tier.price) || 0,
            sold: matchingOrdersForTier.reduce((sum, o) => sum + (o.quantity || 1), 0),
            // Track dynamic group counter arrivals cleanly inside the loop
            checkedIn: matchingOrdersForTier.reduce((sum, o) => sum + (o.checkedIn || 0), 0),
          };
        });

        return {
          id: event.id,
          title: event.title,
          venue: event.venueName || "TBD Location",
          coverImage: event.coverImage || null,
          status: event.status,       // Maps tracking status flags for tabs layout
          startDate: event.startDate, // Maps calendar data markers cleanly
          tiers: formattedTiers,
        };
      })
    );

    return NextResponse.json({ success: true, events: calculatedEvents }, { status: 200 });
  } catch (error: any) {
    console.error("Dashboard API dynamic fetch exception:", error);
    return NextResponse.json({ error: "Internal Analytics Server Error" }, { status: 500 });
  }
}