import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      profileImageUrl: true,
      businessName: true, street: true, city: true, state: true, pincode: true,
      upiId: true, accountNumber: true, ifscCode: true, panNumber: true, gstNumber: true,
    },
  });

  return NextResponse.json(user);
}

const schema = z.object({
  name:             z.string().min(2).optional(),
  phone:            z.string().regex(/^(\+91|91)?[6-9]\d{9}$/).optional(),
  profileImageUrl:  z.string().optional().nullable(),
  businessName:     z.string().optional(),
  street:        z.string().min(3).optional(),
  city:          z.string().min(2).optional(),
  state:         z.string().min(1).optional(),
  pincode:       z.string().regex(/^\d{6}$/).optional(),
  upiId:         z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode:      z.string().optional(),
  panNumber:     z.string().optional(),
  gstNumber:     z.string().optional(),
});

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
