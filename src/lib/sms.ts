import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!client && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return client;
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const c = getClient();
  if (!c || !process.env.TWILIO_PHONE_NUMBER) return;

  // Ensure Indian numbers have +91 prefix
  const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/^0/, "")}`;

  try {
    await c.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formatted,
      body: `Your GrossTech OTP: ${code}. Valid for 10 minutes. Do not share.`,
    });
  } catch (e) {
    console.error("sendOtpSms error:", e);
  }
}
