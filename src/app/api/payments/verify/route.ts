import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_HOLD_DAYS } from "@/lib/constants";
import crypto from "crypto";
import { z } from "zod";
import {
  sendBuyerOrderConfirmation,
  sendSellerOrderNotification,
  sendAdminOrderNotification,
  sendPaymentFailedEmail,
} from "@/lib/email";

const schema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = schema.parse(body);

    // Verify HMAC-SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      const buyer = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (buyer) sendPaymentFailedEmail(buyer, 0).catch(() => {});
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Find ALL orders for this Razorpay payment (one per seller)
    const existingOrders = await prisma.order.findMany({ where: { razorpayOrderId } });
    if (!existingOrders.length) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Idempotency: already processed
    if (existingOrders.every((o) => o.status === "PAYMENT_HELD")) {
      return NextResponse.json({ orderId: existingOrders[0].id });
    }

    const now = new Date();
    const releaseScheduledAt = new Date(now.getTime() + PAYMENT_HOLD_DAYS * 24 * 60 * 60 * 1000);

    // Fetch all order items across all seller orders
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: { in: existingOrders.map((o) => o.id) } },
    });

    await prisma.$transaction(async (tx) => {
      // Update all seller orders
      await Promise.all(
        existingOrders.map((o) =>
          tx.order.update({
            where: { id: o.id },
            data: {
              razorpayPaymentId,
              razorpaySignature,
              status: "PAYMENT_HELD",
              paymentCapturedAt: now,
              releaseScheduledAt,
            },
          })
        )
      );
      // Decrement stock for all items
      await Promise.all(
        orderItems.map((item) =>
          tx.priceOption.update({
            where: { id: item.priceOptionId },
            data: { stock: { decrement: item.quantity } },
          })
        )
      );
    });

    // Send order emails (awaited — fire-and-forget breaks on Vercel serverless)
    try {
      await sendOrderEmails(existingOrders[0].id);
    } catch (e) {
      console.error("Order email error:", e);
    }

    return NextResponse.json({ orderId: existingOrders[0].id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("verify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function sendOrderEmails(orderId: string) {
  const fullOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      items: {
        include: {
          listing: { include: { seller: true } },
          priceOption: true,
        },
      },
    },
  });
  if (!fullOrder) return;

  await sendBuyerOrderConfirmation(fullOrder.buyer, fullOrder, fullOrder.items as Parameters<typeof sendBuyerOrderConfirmation>[2]);

  const sellerMap = new Map<string, { seller: { name: string; email: string }; items: typeof fullOrder.items }>();
  for (const item of fullOrder.items) {
    if (item.listing.seller.role === "SELLER") {
      const sid = item.listing.sellerId;
      if (!sellerMap.has(sid)) sellerMap.set(sid, { seller: item.listing.seller, items: [] });
      sellerMap.get(sid)!.items.push(item);
    }
  }
  for (const { seller, items: sellerItems } of sellerMap.values()) {
    await sendSellerOrderNotification(
      seller,
      fullOrder,
      sellerItems as Parameters<typeof sendSellerOrderNotification>[2],
      fullOrder.buyer
    );
  }

  await sendAdminOrderNotification(
    fullOrder,
    fullOrder.buyer,
    fullOrder.items as Parameters<typeof sendAdminOrderNotification>[2]
  );
}
