import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Map frontend provider strings to standard Paystack Ghana Subaccount Settlement IDs
const getPaystackBankCode = (provider: string): string => {
  const clean = provider.toUpperCase().trim();
  switch (clean) {
    case "MTN":
      return "MTN"; // Paystack Subaccount Ghana MTN identifier
    case "VOD":
    case "TELECEL":
      return "VOD"; // Paystack Subaccount Ghana Telecel identifier
    case "ATL":
    case "ATMONEY":
      return "ATL"; // Paystack Subaccount Ghana AT Money identifier
    case "GCB":
      return "040100"; // GCB Bank GhIPSS Code
    case "ECOBANK":
      return "040108"; // Ecobank Ghana GhIPSS Code
    default:
      return clean; 
  }
};

// ─── 🚀 UPDATED GET ROUTE: REHYDRATE FULL PROFILE DATA LIVE ──────────
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Bad Request: Missing userId parameter query." },
        { status: 400 }
      );
    }

    // Lookup structural profile configurations inside database row
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: userId }
    });

    if (!profile) {
      return NextResponse.json({ isVerified: false, profile: null }, { status: 200 });
    }

    // Check if the record matches the expected security clearance tracking flag
    const isVerified = profile.kycStatus === "VERIFIED";

    return NextResponse.json({ isVerified, profile }, { status: 200 });
  } catch (error: any) {
    console.error("Compliance evaluation matrix read fault:", error);
    return NextResponse.json(
      { error: "Internal Database Server Read Error" },
      { status: 500 }
    );
  }
}

// ─── EXISTING POST ROUTE: SUBACCOUNT CREATION & PERSISTENCE ──────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const {
      userId, 
      legalName,
      email,
      phone,
      documentType,
      idNumber,
      bankProvider,
      accountNumber,
    } = body;

    // 1. Enforce Server-Side Structural Validation Gates
    if (!userId || !legalName || !idNumber || !accountNumber) {
      return NextResponse.json(
        { error: "Bad Request: Missing required ledger parameters." },
        { status: 400 }
      );
    }

    if (documentType === "VOTERS_ID" && !/^\d{10}$/.test(idNumber.trim())) {
      return NextResponse.json(
        { error: "Validation Failure: Voters ID must consist of exactly 10 digits." },
        { status: 422 }
      );
    }

    if (documentType === "GHANA_CARD" && !/^GHA-\d{9}-\d$/.test(idNumber.trim().toUpperCase())) {
      return NextResponse.json(
        { error: "Validation Failure: Ghana Card reference does not match required Nia structure formatting." },
        { status: 422 }
      );
    }

    // 2. Resolve Proper Paystack Settlement Code
    const paystackSettlementBank = getPaystackBankCode(bankProvider);

    // 3. Programmatically Onboard/Update Subaccount with Paystack
    let paystackSubaccountCode = null;

    try {
      const paystackResponse = await fetch("https://api.paystack.co/subaccount", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_name: `${legalName} - vxTicket Hub`,
          settlement_bank: paystackSettlementBank,
          account_number: accountNumber.trim(),
          percentage_charge: 7, // Your 7% flat platform take-home fee slice
          primary_contact_email: email,
          primary_contact_phone: phone,
        }),
      });

      const paystackResult = await paystackResponse.json();

      if (!paystackResponse.ok || !paystackResult.status) {
        throw new Error(paystackResult.message || "Paystack connection onboarding refused.");
      }

      // Capture the live unique tracker reference: ACCT_xxxxxxx
      paystackSubaccountCode = paystackResult.data.subaccount_code;
    } catch (paystackError: any) {
      console.error("Paystack Subaccount Registration Failure:", paystackError);
      return NextResponse.json(
        { error: `Fintech Onboarding Error: ${paystackError.message || "Failed to establish validation channel."}` },
        { status: 502 }
      );
    }

    // 4. Persist Validated Entries & Subaccount Reference Straight to Supabase via Prisma Upsert
    const updatedProfile = await prisma.providerProfile.upsert({
      where: { userId: userId },
      update: {
        legalFullName: legalName,
        contactEmail: email,
        contactPhone: phone,
        documentType: documentType as any,
        documentNumber: idNumber.trim().toUpperCase(),
        momoNumber: ["MTN", "VOD", "ATL"].includes(paystackSettlementBank) ? accountNumber : null,
        bankCode: bankProvider.toUpperCase(),
        payoutAccountId: accountNumber,
        accountNameRaw: legalName.toUpperCase(),
        kycStatus: "VERIFIED", 
        paystackSubaccountCode: paystackSubaccountCode,
      },
      create: {
        userId: userId,
        businessName: `${legalName}'s Enterprise Hub`, 
        legalFullName: legalName,
        contactEmail: email,
        contactPhone: phone,
        documentType: documentType as any,
        documentNumber: idNumber.trim().toUpperCase(),
        momoNumber: ["MTN", "VOD", "ATL"].includes(paystackSettlementBank) ? accountNumber : null,
        bankCode: bankProvider.toUpperCase(),
        payoutAccountId: accountNumber,
        accountNameRaw: legalName.toUpperCase(),
        kycStatus: "VERIFIED",
        paystackSubaccountCode: paystackSubaccountCode,
      },
    });

    return NextResponse.json(
      { 
        message: "Identity records and Paystack split-routes mapped successfully.", 
        profile: updatedProfile,
        paystackSubaccountCode: paystackSubaccountCode 
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Supabase transport connection failure:", error);
    return NextResponse.json(
      { error: "Internal Database Server Write Error" },
      { status: 500 }
    );
  }
}