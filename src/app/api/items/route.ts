import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const all = searchParams.get("all");

  // Simple mode for form dropdowns — return all items with minimal data
  if (all === "true") {
    const items = await prisma.item.findMany({
      select: { id: true, name: true, slug: true, categoryId: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  }

  const categorySlug = searchParams.get("category");
  const search = searchParams.get("search");

  const items = await prisma.item.findMany({
    where: {
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { category: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      category: true,
      _count: {
        select: {
          listings: {
            where: { isActive: true, status: "APPROVED" },
          },
        },
      },
      listings: {
        where: { isActive: true, status: "APPROVED" },
        include: {
          priceOptions: { orderBy: { price: "asc" }, take: 1 },
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  // Compute price range for each item
  const result = items.map((item) => {
    const lowestPrice = item.listings[0]?.priceOptions[0]?.price ?? null;
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl,
      category: item.category,
      sellerCount: item._count.listings,
      lowestPrice,
    };
  });

  return NextResponse.json(result);
}
