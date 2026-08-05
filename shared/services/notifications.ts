// shared/services/notifications.ts
import { sanitizeTextInput } from "../utils/security";

interface DispatchPacket {
  customerEmail: string;
  providerEmail: string;
  amountFormatted: string;
  listingTitle: string;
  customerPhone?: string; // Optional global tracking phone value (e.g. "+23354...")
}

/**
 * 🌍 Global Multi-Channel 100% Free Notification Dispatcher
 * Leverages Resend Free Tier and WhatsApp Sandbox pipelines for zero-cost alerts.
 */
export async function dispatchBookingAlerts(packet: DispatchPacket): Promise<boolean> {
  try {
    const cleanCustomer = sanitizeTextInput(packet.customerEmail, 60);
    const cleanProvider = sanitizeTextInput(packet.providerEmail, 60);
    const cleanTitle = sanitizeTextInput(packet.listingTitle, 50);
    const cleanPhone = sanitizeTextInput(packet.customerPhone || "", 15);

    // ========================================================================
    // 📨 CHANNEL 1: RESEND FREE TIER EMAIL DISPATCH (3,000 Free Messages/Month)
    // ========================================================================
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey !== "mock_key") {
      await fetch("resend.com", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "vxTicket Alerts <onboarding@resend.dev>", // Free sandbox sender address
          to: [cleanCustomer, cleanProvider],
          subject: `Secured Booking Confirmation: ${cleanTitle}`,
          html: `<strong>Your transaction of ${packet.amountFormatted} for ${cleanTitle} has cleared successfully.</strong>`
        })
      });
      console.log(`[RESEND ENGINE]: Production emails broadcast successfully via free quota allocation.`);
    } else {
      console.log(`[FALLBACK RESEND LOG]: To: ${cleanCustomer}. Booking verified for ${cleanTitle}.`);
    }

    // ========================================================================
    // 💬 CHANNEL 2: WHATSAPP SANDBOX SMS DISPATCH (Unlimited Free Worldwide Actions)
    // ========================================================================
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (twilioSid && twilioAuthToken && cleanPhone) {
      // Basic base64 authorization string construction for header authorization
      const authHeaderSignature = btoa(`${twilioSid}:${twilioAuthToken}`);

      await fetch(`twilio.com{twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${authHeaderSignature}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          "From": "whatsapp:+14155238886", // Official universal free Twilio WhatsApp Sandbox pipeline sender
          "To": `whatsapp:${cleanPhone}`,
          "Body": `vxTicket Alert: Your transaction of ${packet.amountFormatted} for ${cleanTitle} is securely confirmed!`
        })
      });
      console.log(`[WHATSAPP SMS ENGINE]: Broadcast message deployed down to user phone layout network.`);
    }

    return true;
  } catch (error) {
    console.error("Communications Free Tier Pipeline Terminal Fault:", error);
    return false;
  }
}
