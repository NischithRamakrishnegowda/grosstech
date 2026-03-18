import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, isActive: true },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: {
        select: {
          id: true,
          name: true,
          businessName: true,
          address: true,
        },
      },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(listing);
}
