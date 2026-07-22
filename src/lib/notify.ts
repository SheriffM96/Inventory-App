import { prisma } from "@/lib/db";

/**
 * WhatsApp notifications are not wired up yet. Every call here is recorded to
 * NotificationLog (sentOk: false) so nothing is lost once you do wire it up -
 * see the README section "Adding WhatsApp notifications" for the Twilio steps
 * that belong in the commented-out block below.
 */
export async function notifyManager(event: string, message: string) {
  const hasTwilioConfig =
    !!process.env.TWILIO_ACCOUNT_SID &&
    !!process.env.TWILIO_AUTH_TOKEN &&
    !!process.env.TWILIO_WHATSAPP_FROM &&
    !!process.env.MANAGER_WHATSAPP_TO;

  if (!hasTwilioConfig) {
    await prisma.notificationLog.create({
      data: { event, message, sentOk: false, error: "WhatsApp not configured" },
    });
    return;
  }

  try {
    // --- Twilio WhatsApp send (uncomment once TWILIO_* env vars are set) ---
    // const accountSid = process.env.TWILIO_ACCOUNT_SID!;
    // const authToken = process.env.TWILIO_AUTH_TOKEN!;
    // const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    // const res = await fetch(
    //   `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Basic ${auth}`,
    //       "Content-Type": "application/x-www-form-urlencoded",
    //     },
    //     body: new URLSearchParams({
    //       From: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM!}`,
    //       To: `whatsapp:${process.env.MANAGER_WHATSAPP_TO!}`,
    //       Body: message,
    //     }),
    //   }
    // );
    // if (!res.ok) throw new Error(await res.text());

    await prisma.notificationLog.create({ data: { event, message, sentOk: false, error: "Twilio send not enabled - see notify.ts" } });
  } catch (err) {
    await prisma.notificationLog.create({
      data: { event, message, sentOk: false, error: err instanceof Error ? err.message : String(err) },
    });
  }
}
