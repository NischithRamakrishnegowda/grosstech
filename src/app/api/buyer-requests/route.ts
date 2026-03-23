import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  description: z.string().min(5, "Description must be at least 5 characters"),
  quantity: z.string().optional(),
  itemId: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.buyerRequest.findMany({
    include: {
      buyer: { select: { id: true, name: true, businessName: true, city: true, state: true } },
      item: { select: { id: true, name: true, slug: true, category: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(requests);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "BUYER") {
    return NextResponse.json({ error: "Only buyers can post purchase requests" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const request = await prisma.buyerRequest.create({
      data: {
        description: data.description,
        quantity: data.quantity || null,
        itemId: data.itemId || null,
        buyerId: session.user.id,
      },
      include: {
        buyer: { select: { id: true, name: true, businessName: true, city: true, state: true } },
        item: { select: { id: true, name: true, slug: true, category: { select: { name: true } } } },
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
