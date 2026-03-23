import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const listings = await prisma.listing.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: {
        select: { id: true, name: true, email: true, businessName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(listings);
}
