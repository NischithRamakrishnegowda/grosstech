import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendListingApprovedEmail, sendListingRejectedEmail } from "@/lib/email";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { seller: { select: { name: true, email: true } } },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.status !== "PENDING_APPROVAL") {
    return NextResponse.json({ error: "Listing is not pending approval" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (data.action === "approve") {
      await prisma.listing.update({
        where: { id },
        data: { status: "APPROVED", isActive: true, rejectionReason: null },
      });

      // Send approval email
      await sendListingApprovedEmail(listing.seller, listing.name).catch((e) =>
        console.error("Failed to send approval email:", e)
      );

      return NextResponse.json({ success: true, status: "APPROVED" });
    } else {
      if (!data.reason?.trim()) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
      }

      await prisma.listing.update({
        where: { id },
        data: { status: "REJECTED", isActive: false, rejectionReason: data.reason.trim() },
      });

      // Send rejection email
      await sendListingRejectedEmail(listing.seller, listing.name, data.reason.trim()).catch((e) =>
        console.error("Failed to send rejection email:", e)
      );

      return NextResponse.json({ success: true, status: "REJECTED" });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
