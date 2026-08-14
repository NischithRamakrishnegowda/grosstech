import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const razorpaySignature = req.headers.get("x-razorpay-signature") || "";

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: { payment: { entity: { order_id: string; id: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const razorpayOrderId = event?.payload?.payment?.entity?.order_id;
  const razorpayPaymentId = event?.payload?.payment?.entity?.id;

  if (!razorpayOrderId) {
    // Unknown event structure — acknowledge and ignore
    return NextResponse.json({ status: "ok" });
  }

  try {
    if (event.event === "payment.captured") {
      // Update ALL seller orders for this payment (one per seller in the cart)
      await prisma.order.updateMany({
        where: { razorpayOrderId, status: "PENDING" },
        data: {
          status: "PAYMENT_HELD",
          razorpayPaymentId,
          paymentCapturedAt: new Date(),
        },
      });
    } else if (event.event === "payment.failed") {
      await prisma.order.updateMany({
        where: { razorpayOrderId, status: "PENDING" },
        data: { status: "FAILED" },
      });
    }
  } catch (e) {
    console.error("Webhook processing error:", e);
    // Still return 200 so Razorpay doesn't retry
  }

  return NextResponse.json({ status: "ok" });
}
