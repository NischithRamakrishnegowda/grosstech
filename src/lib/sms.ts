export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) {
    console.error("2Factor: TWOFACTOR_API_KEY is not set");
    return;
  }

  // Strip +91 or 91 prefix — 2Factor needs 10-digit number
  const number = phone.replace(/^\+?91/, "").replace(/^0/, "");
  console.log(`2Factor: sending OTP to ${number}`);

  try {
    const res = await fetch(
      `https://2factor.in/API/V1/${apiKey}/SMS/${number}/${code}`,
      { method: "GET" }
    );

    const json = await res.json();
    if (json.Status === "Success") {
      console.log("2Factor sent:", json.Details);
    } else {
      console.error("2Factor error:", json.Details);
    }
  } catch (e) {
    console.error("sendOtpSms error:", e);
  }
}
