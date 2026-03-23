import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode"); // RETAIL or BULK
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  const item = await prisma.item.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  // Build price option filter
  const priceOptionWhere: Prisma.PriceOptionWhereInput = {
    ...(mode ? { mode: mode as "RETAIL" | "BULK" } : {}),
    ...(minPrice || maxPrice
      ? {
          price: {
            ...(minPrice ? { gte: parseFloat(minPrice) } : {}),
            ...(maxPrice ? { lte: parseFloat(maxPrice) } : {}),
          },
        }
      : {}),
  };

  const listings = await prisma.listing.findMany({
    where: {
      itemId: item.id,
      isActive: true,
      status: "APPROVED",
      ...(Object.keys(priceOptionWhere).length > 0
        ? { priceOptions: { some: priceOptionWhere } }
        : {}),
    },
    include: {
      priceOptions: {
        where: Object.keys(priceOptionWhere).length > 0 ? priceOptionWhere : undefined,
        orderBy: { price: "asc" },
      },
      seller: {
        select: { id: true, name: true, businessName: true },
      },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ item, listings });
}
