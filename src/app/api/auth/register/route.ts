import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role, OtpType, OtpChannel } from "@prisma/client";
import { generateAndSaveOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { sendOtpSms } from "@/lib/sms";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["BUYER", "SELLER"]),
  phone: z.string().min(10),
  businessName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const password = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password,
        role: data.role as Role,
        phone: data.phone,
        businessName: data.businessName,
      },
    });

    // Send verification OTPs (fire-and-forget)
    Promise.all([
      generateAndSaveOtp(user.id, OtpType.EMAIL_VERIFY, OtpChannel.EMAIL).then((code) =>
        sendOtpEmail(user.email, user.name, code, OtpType.EMAIL_VERIFY)
      ),
      generateAndSaveOtp(user.id, OtpType.PHONE_VERIFY, OtpChannel.PHONE).then((code) =>
        sendOtpSms(user.phone!, code)
      ),
    ]).catch((e) => console.error("OTP send error:", e));

    return NextResponse.json({ id: user.id, email: user.email, phone: user.phone, role: user.role });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
