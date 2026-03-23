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
  phone: z.string().regex(/^(\+91|91)?[6-9]\d{9}$/, "Invalid Indian phone number"),
  businessName: z.string().optional(),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  upiId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "This email is already registered. Please sign in." }, { status: 400 });
    }

    const phoneExists = await prisma.user.findFirst({ where: { phone: data.phone } });
    if (phoneExists) {
      return NextResponse.json({ error: "This phone number is already registered. Please sign in." }, { status: 400 });
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
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        upiId: data.upiId,
      },
    });

    // Send verification OTPs
    await Promise.all([
      generateAndSaveOtp(user.id, OtpType.EMAIL_VERIFY, OtpChannel.EMAIL).then((code) => {
        if (process.env.NODE_ENV !== "production") console.log(`[OTP] EMAIL_VERIFY → ${user.email} — Code: ${code}`);
        return sendOtpEmail(user.email, user.name, code, OtpType.EMAIL_VERIFY);
      }),
      generateAndSaveOtp(user.id, OtpType.PHONE_VERIFY, OtpChannel.PHONE).then((code) => {
        if (process.env.NODE_ENV !== "production") console.log(`[OTP] PHONE_VERIFY → ${user.phone} — Code: ${code}`);
        return sendOtpSms(user.phone!, code);
      }),
    ]).catch((e) => console.error("OTP send error:", e));

    return NextResponse.json({ id: user.id, email: user.email, phone: user.phone, role: user.role });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
