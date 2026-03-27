export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.error("Fast2SMS: FAST2SMS_API_KEY is not set");
    return;
  }

  // Strip +91 or 91 prefix — Fast2SMS needs 10-digit number
  const number = phone.replace(/^\+?91/, "").replace(/^0/, "");
  console.log(`Fast2SMS: sending OTP to ${number}`);

  try {
    const params = new URLSearchParams({
      authorization: apiKey,
      route: "q",
      message: `Your GrossTech OTP is ${code}. Valid for 10 minutes. Do not share.`,
      numbers: number,
      flash: "0",
    });

    const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?${params}`, {
      method: "GET",
      headers: { "cache-control": "no-cache" },
    });

    const json = await res.json();
    if (!json.return) {
      console.error("Fast2SMS error:", json.message);
    } else {
      console.log("Fast2SMS sent:", json.message);
    }
  } catch (e) {
    console.error("sendOtpSms error:", e);
  }
}
