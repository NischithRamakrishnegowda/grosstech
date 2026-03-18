import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { OtpType, OtpChannel } from "@prisma/client";
import { generateAndSaveOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { sendOtpSms } from "@/lib/sms";

const schema = z.object({
  identifier: z.string().min(1),
  channel: z.nativeEnum(OtpChannel),
  type: z.nativeEnum(OtpType),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, channel, type } = schema.parse(body);

    // Validate format before user lookup
    if (channel === OtpChannel.EMAIL) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
      }
    } else {
      const phoneDigits = identifier.replace(/[\s\-\+]/g, "");
      if (!/^\d{10,15}$/.test(phoneDigits)) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
      }
    }

    const user = await prisma.user.findFirst({
      where: channel === OtpChannel.EMAIL ? { email: identifier } : { phone: identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "No account found with this email/phone. Please sign up first." }, { status: 404 });
    }

    // Rate limit: max 3 OTPs per 10 min
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await prisma.otpToken.count({
      where: { userId: user.id, type, channel, createdAt: { gt: tenMinAgo } },
    });
    if (recentCount >= 3) {
      return NextResponse.json({ error: "Too many OTP requests. Try again in 10 minutes." }, { status: 429 });
    }

    const code = await generateAndSaveOtp(user.id, type, channel);

    if (channel === OtpChannel.EMAIL) {
      await sendOtpEmail(user.email, user.name, code, type);
    } else {
      if (user.phone) await sendOtpSms(user.phone, code);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(`[OTP] ${channel} → ${channel === OtpChannel.EMAIL ? user.email : user.phone} — Code: ${code}`);
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
