import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { OtpType } from "@prisma/client";

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, newPassword } = schema.parse(body);

    const otpToken = await prisma.otpToken.findFirst({
      where: {
        verifiedToken: token,
        type: OtpType.PASSWORD_RESET,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: otpToken.userId }, data: { password: hashed } });

    // Invalidate the token
    await prisma.otpToken.update({
      where: { id: otpToken.id },
      data: { verifiedToken: null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
