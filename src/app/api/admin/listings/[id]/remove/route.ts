import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendListingRemovedEmail } from "@/lib/email";
import { CACHE_TAGS, invalidateTag } from "@/lib/cache";

const schema = z.object({
  reason: z.string().min(5, "Please provide a reason"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { reason } = schema.parse(body);

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: { select: { name: true, email: true } } },
    });

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    if (listing.source === "ADMIN") {
      return NextResponse.json({ error: "Use delete for admin listings" }, { status: 400 });
    }

    await prisma.listing.update({
      where: { id },
      data: { isActive: false, status: "REJECTED", rejectionReason: reason },
    });

    await sendListingRemovedEmail(listing.seller, listing.name, reason).catch((e) =>
      console.error("Failed to send removal email:", e)
    );

    invalidateTag(CACHE_TAGS.items);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
