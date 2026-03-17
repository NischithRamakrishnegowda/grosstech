import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const priceOptionSchema = z.object({
  weight: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
});

const schema = z.object({
  name: z.string().min(2),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string(),
  priceOptions: z.array(priceOptionSchema).min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
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
        sellerId: session.user.id,
        source: "SELLER",
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
