import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(request: Request) {
  try {
    // 1. Safely read and parse request body
    let body: any = {};
    try {
      body = await request.json();
    } catch (parseErr) {
      console.warn("⚠️ Request body was empty or aborted during compilation.");
      return NextResponse.json(
        { status: "ERROR", message: "Request payload missing or timed out." },
        { status: 400 }
      );
    }

    const { manualCode, checkInCount = 1, eventId } = body;

    if (!manualCode) {
      return NextResponse.json(
        { status: "ERROR", message: "Validation code required." },
        { status: 400 }
      );
    }

    // 2. Database Lookup
    const order = await prisma.ticketOrder.findFirst({
      where: { manualCode: manualCode.trim() },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({
        status: "DENIED",
        message: "Invalid Ticket. Code not found in database.",
      });
    }

    if (eventId && order.eventId && order.eventId !== eventId) {
      return NextResponse.json({
        status: "DENIED",
        message: "Ticket belongs to a different event!",
      });
    }

    // 3. Status Verification
    const rawStatus = (order.status || "").toUpperCase();
    const isPaid = ["SUCCESSFUL", "SUCCESS", "PAID", "COMPLETED"].includes(rawStatus);

    const attendeeName = order.customer?.name || order.customer?.email || "Guest";
    const tierName = order.ticketTierName || "Standard";
    const currentCheckedIn = order.checkedIn ?? 0;
    const totalQuantity = order.quantity ?? 1;

    if (!isPaid) {
      return NextResponse.json({
        status: "DENIED",
        message: "Check-in Denied! This ticket order is unpaid or pending processing.",
        details: {
          attendee: attendeeName,
          tier: tierName,
          totalCheckedIn: currentCheckedIn,
          totalQuantity: totalQuantity,
        },
      });
    }

    // 4. Capacity Verification
    const requestedCount = Number(checkInCount);

    if (currentCheckedIn >= totalQuantity) {
      return NextResponse.json({
        status: "DENIED",
        message: `Ticket already fully checked in (${currentCheckedIn}/${totalQuantity} inside).`,
        details: {
          attendee: attendeeName,
          tier: tierName,
          totalCheckedIn: currentCheckedIn,
          totalQuantity: totalQuantity,
        },
      });
    }

    if (currentCheckedIn + requestedCount > totalQuantity) {
      const remaining = totalQuantity - currentCheckedIn;
      return NextResponse.json({
        status: "DENIED",
        message: `Cannot check in ${requestedCount} guests. Only ${remaining} spots left on this ticket.`,
        details: {
          attendee: attendeeName,
          tier: tierName,
          totalCheckedIn: currentCheckedIn,
          totalQuantity: totalQuantity,
        },
      });
    }

    // 5. Atomic PostgreSQL Increment
    const updatedOrder = await prisma.ticketOrder.update({
      where: { id: order.id },
      data: {
        checkedIn: { increment: requestedCount },
      },
    });

    return NextResponse.json({
      status: "SUCCESS",
      message: "Check-in Approved!",
      details: {
        attendee: attendeeName,
        tier: tierName,
        checkedInNow: requestedCount,
        totalCheckedIn: updatedOrder.checkedIn,
        totalQuantity: totalQuantity,
      },
    });

  } catch (error: any) {
    console.error("❌ Check-in API Exception:", error);
    return NextResponse.json({ status: "ERROR", message: error.message }, { status: 500 });
  }
}