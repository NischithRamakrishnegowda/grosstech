import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { isActive: true, status: "APPROVED" },
    select: {
      id: true,
      name: true,
      brand: true,
      description: true,
      imageUrl: true,
      category: { select: { id: true, name: true, slug: true } },
      priceOptions: {
        select: { id: true, weight: true, price: true, stock: true, mode: true, minQty: true },
        orderBy: { price: "asc" },
      },
      seller: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(listings);
}
