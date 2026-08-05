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

export async function POST(request: Request) {
  try {
    const { providerId, businessName, bankCode, accountNumber, accountName } = await request.json();

    // 1. Basic input validation
    if (!providerId || !businessName || !bankCode || !accountNumber) {
      return NextResponse.json({ error: "Missing required payout configurations" }, { status: 400 });
    }

    // 2. Resolve Proper Paystack Settlement Code before calling their API
    const paystackSettlementBank = getPaystackBankCode(bankCode);

    // 3. Call Paystack's API to create a split payout subaccount
    const paystackResponse = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName.trim(),
        settlement_bank: paystackSettlementBank, 
        account_number: accountNumber.trim(), // The MoMo wallet phone number or bank account number
        percentage_charge: 7, // Your default platform cut (vxTicket's 7%)
        primary_contact_name: accountName || businessName,
      }),
    });

    const resData = await paystackResponse.json();

    if (!paystackResponse.ok || !resData.status) {
      return NextResponse.json({ 
        error: resData.message || "Paystack subaccount initialization rejected." 
      }, { status: 422 });
    }

    // Extract the newly generated subaccount code (e.g., ACCT_xxxxxxxxx)
    const { subaccount_code } = resData.data;

    // 4. Update or create the profile details in your local Prisma database
    const updatedProfile = await prisma.providerProfile.upsert({
      where: { userId: providerId }, 
      update: {
        paystackSubaccountCode: subaccount_code, 
        bankCode: bankCode.toUpperCase(), 
        momoNumber: ["MTN", "VOD", "ATL"].includes(paystackSettlementBank) ? accountNumber : null, 
        payoutAccountId: accountNumber, 
      },
      create: {
        userId: providerId, 
        businessName: businessName.trim(), 
        paystackSubaccountCode: subaccount_code, 
        bankCode: bankCode.toUpperCase(), 
        momoNumber: ["MTN", "VOD", "ATL"].includes(paystackSettlementBank) ? accountNumber : null, 
        payoutAccountId: accountNumber,
        kycStatus: "VERIFIED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Payout setup complete. Platform split enabled.",
      subaccountCode: subaccount_code,
    });

  } catch (error) {
    console.error("Critical subaccount registration fault:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}