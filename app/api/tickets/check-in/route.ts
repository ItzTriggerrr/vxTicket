import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";


export async function POST(request: Request) {
  try {
    const { manualCode } = await request.json();

    if (!manualCode) {
      return NextResponse.json({ error: "Missing verification code" }, { status: 400 });
    }

    // Clean up character spacing/case formatting for manual input accuracy
    const cleanCode = manualCode.toUpperCase().replace(/\s+/g, "").trim();

    // 1. Find the ticket order and check transaction validity
    const order = await prisma.ticketOrder.findUnique({
      where: { manualCode: cleanCode },
      include: { event: true, customer: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Invalid Ticket Pass" }, { status: 444 });
    }

    if (order.status.toLowerCase() !== "completed" && order.status.toLowerCase() !== "success") {
      return NextResponse.json({ error: `Payment status is ${order.status}` }, { status: 400 });
    }

    // 2. Check if the ticket group is already fully checked in
    if (order.checkedIn >= order.quantity) {
      return NextResponse.json({
        error: "Ticket Fully Used",
        details: {
          title: order.event.title,
          holder: order.customer?.name || "Guest Attendee",
          tier: order.ticketTierName,
          count: `${order.checkedIn}/${order.quantity}`
        }
      }, { status: 422 });
    }

    // 3. Atomically increment the check-in count to block race conditions across gates
    const updatedOrder = await prisma.ticketOrder.update({
      where: { manualCode: cleanCode },
      data: {
        checkedIn: { increment: 1 },
        checkInStatus: "Checked In"
      }
    });

    // 4. Return successful validation payload to the scanner UI
    return NextResponse.json({
      success: true,
      message: "Access Granted",
      data: {
        title: order.event.title,
        holder: order.customer?.name || "Guest Attendee",
        tier: order.ticketTierName,
        scannedCount: updatedOrder.checkedIn,
        totalQuantity: order.quantity,
      }
    });

  } catch (error) {
    console.error("Critical gate scanner fault:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}