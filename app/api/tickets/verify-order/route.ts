import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference parameter" }, { status: 400 });
    }

    const order = await prisma.ticketOrder.findFirst({
      where: {
        OR: [
          { transactionId: reference },
          { manualCode: reference }
        ]
      },
      select: {
        id: true,
        status: true,
        eventId: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    });
  } catch (error: any) {
    console.error("Order verification error:", error);
    return NextResponse.json({ success: false, error: "Internal verification error" }, { status: 500 });
  }
}