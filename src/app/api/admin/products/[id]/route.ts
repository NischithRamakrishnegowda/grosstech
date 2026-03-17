import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  priceOptions: z
    .array(
      z.object({
        weight: z.string().min(1),
        price: z.number().positive(),
        stock: z.number().int().min(0),
      })
    )
    .optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const { priceOptions, ...rest } = data;

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...rest,
        ...(priceOptions && {
          priceOptions: {
            deleteMany: {},
            create: priceOptions,
          },
        }),
      },
      include: { priceOptions: true, category: true },
    });

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
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.listing.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
