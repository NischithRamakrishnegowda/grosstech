interface PayoutParams {
  amount: number; // in rupees — converted to paise internally
  upiId: string;
  sellerName: string;
  sellerEmail?: string;
  sellerPhone?: string;
  referenceId: string;
  narration?: string;
}

interface PayoutResult {
  success: boolean;
  payoutId?: string;
  status?: string;
  error?: string;
}

/**
 * Create a RazorpayX payout to a seller's UPI VPA.
 *
 * Requires env vars: RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET, RAZORPAYX_ACCOUNT_NUMBER.
 * If not configured, returns { success: false } so the caller can fall back gracefully.
 */
export async function createRazorpayPayout(params: PayoutParams): Promise<PayoutResult> {
  const keyId = process.env.RAZORPAYX_KEY_ID;
  const keySecret = process.env.RAZORPAYX_KEY_SECRET;
  const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;

  if (!keyId || !keySecret || !accountNumber) {
    return { success: false, error: "RazorpayX credentials not configured" };
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  try {
    const res = await fetch("https://api.razorpay.com/v1/payouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        account_number: accountNumber,
        fund_account: {
          account_type: "vpa",
          vpa: { address: params.upiId },
          contact: {
            name: params.sellerName,
            ...(params.sellerEmail ? { email: params.sellerEmail } : {}),
            ...(params.sellerPhone ? { contact: params.sellerPhone } : {}),
            type: "vendor",
          },
        },
        amount: Math.round(params.amount * 100), // paise
        currency: "INR",
        mode: "UPI",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: params.referenceId,
        narration: params.narration || "GrossTech seller payout",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("RazorpayX payout error:", data);
      return {
        success: false,
        error: data.error?.description || "Payout failed",
      };
    }

    return { success: true, payoutId: data.id, status: data.status };
  } catch (e) {
    console.error("RazorpayX payout exception:", e);
    return { success: false, error: "Payout request failed" };
  }
}
