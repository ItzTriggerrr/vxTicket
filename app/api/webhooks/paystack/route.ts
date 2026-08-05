import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // 1. Capture the raw body text and Paystack signature header
    const rawBody = await request.text();
    const paystackSignature = request.headers.get("x-paystack-signature");

    if (!paystackSignature) {
      return NextResponse.json(
        { success: false, error: "Missing verification credentials." },
        { status: 401 }
      );
    }

    // 2. Cryptographic Security Check: Verify signature using your secret key
    const computedHash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(rawBody)
      .digest("hex");

    if (computedHash !== paystackSignature) {
      console.error("🚨 Webhook security alert: Invalid Paystack Signature.");
      return NextResponse.json(
        { success: false, error: "Signature mismatch verification failed." },
        { status: 401 }
      );
    }

    // 3. Parse Webhook Event Payload
    const payload = JSON.parse(rawBody);
    const { event, data } = payload;

    // We specifically listen to "charge.success" which confirms funds are cleared
    if (event === "charge.success") {
      const transactionReference = data.reference;
      const orderIdFromMetadata = data.metadata?.orderId;
      const manualCodeFromMetadata = data.metadata?.manualCode;

      console.log(`💰 Paystack Payment Verified! Processing reference: ${transactionReference}`);

      // ─── ⚡ HIGH-VOLUME FEATURE: WEBHOOK IDEMPOTENCY GUARD ───
      const eventIdempotencyKey = `webhook:${transactionReference}`;
      try {
        await prisma.webhookLog.create({
          data: { id: eventIdempotencyKey },
        });
      } catch (dbError) {
        // Unique constraint failure means this reference string is already logged or actively processing
        console.warn(`🔄 Idempotency catch: Webhook reference ${transactionReference} skipped.`);
        return NextResponse.json({ success: true, status: "Already processing / completed." }, { status: 200 });
      }

      // Robust deep lookup: Try matching by reference id, fallback to metadata values
      const order = await prisma.ticketOrder.findFirst({
        where: {
          OR: [
            { transactionId: transactionReference },
            { id: orderIdFromMetadata },
            { manualCode: manualCodeFromMetadata }
          ]
        },
      });

      if (!order) {
        console.warn(`⚠️ Order reference ${transactionReference} not registered in db.`);
        return NextResponse.json({ success: true, warning: "Order not resolved." });
      }

      // If the order is already marked successful, return early to avoid redundancy
      if (order.status.toLowerCase() === "successful" || order.status.toLowerCase() === "completed" || order.status.toLowerCase() === "success") {
        return NextResponse.json({ success: true, status: "Already processed." });
      }

      // 4. Update the Database records inside an atomic isolation transaction
      await prisma.$transaction([
        // Update Order Status to "Successful" to match standard state parameters across all ticket types
        prisma.ticketOrder.update({
          where: { id: order.id },
          data: {
            status: "Successful",
            transactionId: transactionReference, // Secure reference matching context post-checkout
            paymentProvider: data.channel === "mobile_money" ? "MoMo" : data.channel,
          },
        }),

        // FIXED INVENTORY ACCURACY: Increments the precise ticket tier metrics
        prisma.ticketTier.updateMany({
          where: {
            eventId: order.eventId,
            name: order.ticketTierName
          },
          data: {
            sold: {
              increment: order.quantity,
            },
          },
        }),
      ]);

      console.log(`✅ vxTicket ID: ${order.id} is now fully authorized and tier inventory adjusted!`);
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Webhook Pipeline Error:", err.message);
    return NextResponse.json(
      { success: false, error: "Internal crash logged." },
      { status: 200 }
    );
  }
}