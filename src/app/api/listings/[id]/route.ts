import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CACHE_TAGS, invalidateTag } from "@/lib/cache";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: { select: { id: true, name: true, businessName: true } },
    },
  });

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sellers can only fetch their own listings; admins can fetch any
  if (session.user.role === "SELLER" && listing.sellerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(listing);
}

const priceOptionSchema = z.object({
  id: z.string().optional(),
  weight: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().min(0),
  mode: z.enum(["RETAIL", "BULK"]).default("RETAIL"),
  minQty: z.number().int().min(1).default(1),
});

const schema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  itemId: z.string().optional(),
  isActive: z.boolean().optional(),
  priceOptions: z.array(priceOptionSchema).optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const { priceOptions, isActive, ...rest } = data;

    // Sellers editing any non-admin listing triggers re-review
    // Admins can update freely including isActive
    const isSeller = session.user.role === "SELLER";
    const resubmit = isSeller && (listing.status === "REJECTED" || listing.status === "APPROVED");

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...rest,
        // Only allow admin to directly set isActive; sellers can't bypass approval
        ...(session.user.role === "ADMIN" && isActive !== undefined && { isActive }),
        ...(resubmit && { status: "PENDING_APPROVAL", isActive: false, rejectionReason: null }),
        ...(priceOptions && {
          priceOptions: {
            deleteMany: {},
            create: priceOptions.map(({ id: _id, ...po }) => po),
          },
        }),
      },
      include: { priceOptions: true, category: true },
    });

    invalidateTag(CACHE_TAGS.items);
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (listing.sellerId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.listing.update({ where: { id }, data: { isActive: false } });
  invalidateTag(CACHE_TAGS.items);
  return NextResponse.json({ success: true });
}
