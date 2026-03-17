import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const { sellerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unlock = await prisma.contactUnlock.findUnique({
    where: { buyerId_sellerId: { buyerId: session.user.id, sellerId } },
  });

  if (!unlock?.isPaid) {
    return NextResponse.json({ locked: true });
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { name: true, phone: true, email: true, address: true, businessName: true },
  });

  return NextResponse.json({ locked: false, seller });
}
