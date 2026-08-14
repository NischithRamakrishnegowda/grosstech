import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admin and seller can mark requests as resolved
  if (session.user.role === "BUYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const request = await prisma.buyerRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.buyerRequest.update({
    where: { id },
    data: {
      isResolved: !request.isResolved,
      resolvedAt: !request.isResolved ? new Date() : null,
    },
  });

  return NextResponse.json({ isResolved: updated.isResolved });
}
