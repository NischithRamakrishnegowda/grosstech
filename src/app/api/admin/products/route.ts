import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string(),
  itemId: z.string().optional(),
  priceOptions: z
    .array(
      z.object({
        weight: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().min(0),
        mode: z.enum(["RETAIL", "BULK"]).default("RETAIL"),
        minQty: z.number().int().min(1).default(1),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const listing = await prisma.listing.create({
      data: {
        name: data.name,
        brand: data.brand,
        description: data.description,
        imageUrl: data.imageUrl,
        categoryId: data.categoryId,
        itemId: data.itemId,
        sellerId: session.user.id,
        source: "ADMIN",
        priceOptions: { create: data.priceOptions },
      },
      include: { priceOptions: true, category: true },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(listings);
}
