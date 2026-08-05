import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ticketCode, eventId } = body;

    // 1. Structural Payload Validation
    if (!ticketCode || !eventId) {
      return NextResponse.json(
        { error: "Invalid parameters. Both ticketCode and eventId are required." },
        { status: 400 }
      );
    }

    // 2. Fetch the Ticket Order Record from PostgreSQL
    // We look up via manualCode and include the event relationship to crosscheck bounds
    const ticketOrder = await prisma.ticketOrder.findUnique({
      where: { manualCode: ticketCode },
      include: { event: true }
    });

    // 3. Validation Check: Does the ticket exist in our ledger?
    if (!ticketOrder) {
      return NextResponse.json(
        { error: "Invalid Ticket. This ticket reference code does not exist in the vxTicket system." },
        { status: 404 }
      );
    }

    // 4. Security Check: Does this ticket belong to the specific event being scanned?
    if (ticketOrder.eventId !== eventId) {
      return NextResponse.json(
        { 
          error: `Wrong Venue/Event. This ticket belongs to "${ticketOrder.event.title}", but you are currently scanning for a different event listing.` 
        },
        { status: 422 } // Unprocessable entity
      );
    }

    // 5. Transaction Check: Has the order actually been cleared/paid?
    // If your webhook sets this to "Success" or "Paid", catch any unauthorized or pending attempts here
    if (ticketOrder.status.toLowerCase() === "pending") {
      return NextResponse.json(
        { error: "Payment Unverified. This transaction ledger is still pending clearance." },
        { status: 402 } // Payment Required
      );
    }

    // 6. Fraud Prevention Check: Has this specific QR token already walked through the gates?
    if (ticketOrder.checkInStatus === "Checked In") {
      return NextResponse.json(
        { 
          error: "Ticket Already Reused!",
          scannedAt: ticketOrder.updatedAt,
          message: "This pass was already processed at the gates. Deny admission to prevent duplicate entry fraud."
        },
        { status: 409 } // Conflict state
      );
    }

    // 7. Clear Mutation: Atomically upgrade ticket admission flags
    const updatedOrder = await prisma.ticketOrder.update({
      where: { manualCode: ticketCode },
      data: { 
        checkInStatus: "Checked In" 
      }
    });

    // 8. Success Response: Send back safe profile payload data to show on the bouncer's screen
    return NextResponse.json(
      {
        success: true,
        message: "Access Granted. Welcome to vxTicket!",
        attendeeDetails: {
          ticketTier: updatedOrder.ticketTierName,
          quantity: updatedOrder.quantity,
          currency: updatedOrder.currency,
          totalPaid: updatedOrder.totalAmount
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Ticket Verification Processing Exception:", error);
    return NextResponse.json(
      { error: "Internal admission engine fault. Please retry scanning." },
      { status: 500 }
    );
  }
}