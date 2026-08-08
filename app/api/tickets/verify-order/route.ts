import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ success: false, error: "Missing reference" }, { status: 400 });
    }

    let order = await prisma.ticketOrder.findFirst({
      where: {
        OR: [{ transactionId: reference }, { manualCode: reference }]
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order reference not found" }, { status: 404 });
    }

    // 🚀 TELECEL / NETWORK LAG FALLBACK:
    // If the database still shows "Pending", call Paystack API directly to check if money cleared!
    if (order.status.toLowerCase() === "pending" && process.env.PAYSTACK_SECRET_KEY) {
      try {
        const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        });

        const paystackData = await paystackRes.json();

        // If Paystack confirms funds were collected despite Telecel's delay:
        if (paystackData.status && paystackData.data?.status === "success") {
          // Update order status in Supabase instantly
          const [updatedOrder] = await prisma.$transaction([
            prisma.ticketOrder.update({
              where: { id: order.id },
              data: {
                status: "Successful",
                paymentProvider: paystackData.data.channel === "mobile_money" ? "MoMo" : paystackData.data.channel,
              },
            }),
            prisma.ticketTier.updateMany({
              where: {
                eventId: order.eventId,
                name: order.ticketTierName,
              },
              data: {
                sold: { increment: order.quantity },
              },
            }),
          ]);

          order = updatedOrder;
        }
      } catch (paystackFetchErr) {
        console.error("Direct Paystack re-query attempt failed:", paystackFetchErr);
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
    });
  } catch (error: any) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, error: "Internal verification fault" }, { status: 500 });
  }
}