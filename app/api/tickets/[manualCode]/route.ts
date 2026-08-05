import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(
  request: Request, 
  { params }: { params: { manualCode: string } }
) {
  try {
    const { manualCode } = params;
    
    if (!manualCode) {
      return NextResponse.json({ error: "Missing validation code parameter" }, { status: 400 });
    }

    const cleanCode = manualCode.trim();

    // 1. Try finding the record assuming the code matches exactly as sent (e.g., lowercase UUID)
    let order = await prisma.ticketOrder.findUnique({
      where: { manualCode: cleanCode },
      include: {
        event: true,
        customer: true,
      },
    });

    // 2. Fallback: Try matching with uppercase format
    if (!order) {
      order = await prisma.ticketOrder.findUnique({
        where: { manualCode: cleanCode.toUpperCase() },
        include: {
          event: true,
          customer: true,
        },
      });
    }

    // 3. Second Fallback: Check if the incoming token matches the primary 'id' column directly
    if (!order) {
      order = await prisma.ticketOrder.findUnique({
        where: { id: cleanCode },
        include: {
          event: true,
          customer: true,
        },
      });
    }

    if (!order) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Safely mapping database keys exactly as defined in your working schema
    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        status: order.status,
        checkInStatus: order.checkInStatus,
        quantity: order.quantity,
        checkedIn: order.checkedIn,
        manualCode: order.manualCode,
        totalAmount: order.totalAmount,
        currency: order.currency,
        event: {
          title: order.event.title,
          date: order.event.startDate.toISOString(),
          venue: order.event.venueName,
          address: order.event.address,
        },
        customer: {
          name: order.customer?.name || "Guest Attendee",
        }
      }
    });
  } catch (error) {
    console.error("Secure ticket lookup exception fault:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}