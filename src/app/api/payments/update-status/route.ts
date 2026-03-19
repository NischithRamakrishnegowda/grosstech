import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  internalOrderId: z.string(),
  status: z.enum(["FAILED", "CANCELLED"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { internalOrderId, status } = schema.parse(body);

    const order = await prisma.order.findFirst({
      where: { id: internalOrderId, buyerId: session.user.id },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Idempotent: skip if already in target status
    if (order.status === status) return NextResponse.json({ success: true });

    // Only allow PENDING → FAILED / CANCELLED
    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Cannot update order in current status" }, { status: 409 });
    }

    await prisma.order.update({
      where: { id: internalOrderId },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
