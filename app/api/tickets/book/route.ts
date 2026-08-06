import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      eventId,
      ticketTierName,
      quantity,
      totalAmount,
      currency,
      paymentProvider,
      customerName,
      customerEmail,
      momoNumber,
    } = body;

    // 1. Basic Parameter Validation
    if (!eventId || !ticketTierName || !quantity || !customerEmail || !customerName) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory customer checkout attributes." },
        { status: 400 }
      );
    }

    // 2. Query Ticket Tier, Verify Real-Time Capacity, & Fetch Event Organizer Profile
    const event = await prisma.eventListing.findUnique({
      where: { id: eventId },
      include: { ticketTiers: true },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Target event listing not found." },
        { status: 404 }
      );
    }

    // Pull the event organizer's registered KYC payout profile from Supabase
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId: event.providerId },
    });

    const tier = event.ticketTiers.find((t) => t.name === ticketTierName);
    if (!tier) {
      return NextResponse.json(
        { success: false, error: "Selected ticket tier parameters are invalid." },
        { status: 404 }
      );
    }

    // Capacity Check: Ensure vxTicket doesn't overbook the venue
    if (tier.capacity !== null) {
      const existingOrdersCount = await prisma.ticketOrder.aggregate({
        where: { eventId, ticketTierName: tier.name, status: "Successful" },
        _sum: { quantity: true },
      });
      const currentSold = existingOrdersCount._sum.quantity || 0;

      if (currentSold + quantity > tier.capacity) {
        return NextResponse.json(
          { success: false, error: "This ticket tier is fully booked!" },
          { status: 400 }
        );
      }
    }

    // 3. Financial calculations: Host absorbs the 7% fee
    const calculatedGrandTotal = tier.price * quantity;
    const calculatedPlatformFee = tier.isFree ? 0 : calculatedGrandTotal * 0.07; // 7% Platform cut
    const calculatedProviderPayout = calculatedGrandTotal - calculatedPlatformFee; // 93% Net Host share

    // 4. Generate Secure Alphanumeric Check-In Keys
    const secureReference = `VT-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const transactionReference = `TX-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    // 5. Look up or create Customer User Profile
    let customerUser = await prisma.user.findUnique({
      where: { email: customerEmail.toLowerCase().trim() },
    });

    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          id: `cust_${crypto.randomBytes(8).toString("hex")}`,
          email: customerEmail.toLowerCase().trim(),
          name: customerName.trim(),
          role: "CUSTOMER", // Forces Customer Role association
        },
      });
    }

    // 6. 💸 PAYSTACK DYNAMIC SPLIT CHECKOUT INITIALIZATION
    let authorizationUrl = null;
    let gatewayMessage = "Mock checkout simulated.";

    if (!tier.isFree && process.env.PAYSTACK_SECRET_KEY) {
      try {
        // Enforce mandatory host payout subaccount requirement
        const targetSubaccountCode = (providerProfile as any)?.paystackSubaccountCode;

        if (!targetSubaccountCode || !targetSubaccountCode.startsWith("ACCT_")) {
          return NextResponse.json(
            { 
              success: false, 
              error: "The organizer for this event has not completed their live subaccount verification." 
            },
            { status: 400 }
          );
        }

        // Convert flat amount into Pesewas/Kobo (multiplied by 100 as required by Paystack API)
        const amountInSubunits = Math.round(calculatedGrandTotal * 100);
        const providerShareInSubunits = Math.round(calculatedProviderPayout * 100);

        // Build the authorization payload base
        const paystackPayload: any = {
          email: customerEmail.toLowerCase().trim(),
          amount: amountInSubunits,
          reference: transactionReference,
          currency: currency || "GHS",
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment-success`,
          metadata: {
            eventId: event.id,
            ticketTierName: tier.name,
            quantity: quantity,
          },
          split: {
            type: "flat",
            bearer: "subaccount", // Vendor subaccount absorbs standard Paystack transaction gateway fees
            subaccounts: [
              {
                subaccount: targetSubaccountCode, // ACCT_xxxxxxx
                share: providerShareInSubunits, // The vendor's exact 93% share split allocation
              }
            ]
          }
        };

        // Call the Paystack Transaction Initialize Endpoint
        const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paystackPayload),
        });

        const paystackResult = await paystackResponse.json();
        
        if (paystackResult.status) {
          authorizationUrl = paystackResult.data.authorization_url; // Directs to the checkout interface payment link
          gatewayMessage = "Payment authorization link generated successfully.";
        } else {
          console.error("Paystack Initialization Error:", paystackResult.message);
          return NextResponse.json({ success: false, error: paystackResult.message }, { status: 400 });
        }
      } catch (paystackError) {
        console.error("Paystack Gateway Timeout / Exception:", paystackError);
        return NextResponse.json({ success: false, error: "Paystack gateway connection timeout." }, { status: 500 });
      }
    }

    // 7. Store Ticket Transaction into Supabase Database
    const order = await prisma.ticketOrder.create({
      data: {
        eventId: event.id,
        customerId: customerUser.id,
        ticketTierName: tier.name,
        quantity,
        totalAmount: calculatedGrandTotal,
        currency: currency || "GHS",
        platformFee: calculatedPlatformFee, // Exact 7% platform cut recorded
        providerPayout: calculatedProviderPayout, // Remaining 93% net payout recorded
        paymentProvider: tier.isFree ? "Free" : paymentProvider,
        transactionId: transactionReference,
        manualCode: secureReference, // The unique check-in security key
        status: tier.isFree ? "Successful" : "Pending", // Set to successful instantly if free pass
        checkInStatus: "Not Arrived", // Default status before entry scan
      },
    });

    // 🧠 INVENTORY CONTROL: Free tickets bypass the webhook entirely,
    // so we increment their metrics instantly right here!
    if (tier.isFree) {
      await prisma.eventListing.update({
        where: { id: eventId },
        data: {
          ticketsSold: {
            increment: quantity,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      manualCode: secureReference,
      checkoutUrl: authorizationUrl, // Return this redirect checkout link to your customer frontend view
      message: tier.isFree ? "Free Ticket booking locked!" : gatewayMessage,
    });

  } catch (dbError: any) {
    console.error("Database Write Failover Catch:", dbError);
    return NextResponse.json(
      {
        success: false,
        error: "Transaction could not be completed. Network timeout.",
      },
      { status: 500 }
    );
  }
}