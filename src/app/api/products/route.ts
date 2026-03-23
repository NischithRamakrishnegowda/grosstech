import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { isActive: true, status: "APPROVED" },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(listings);
}
