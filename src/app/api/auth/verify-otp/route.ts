import { NextResponse } from "next/server";
import { z } from "zod";
import { OtpType, OtpChannel } from "@prisma/client";
import { verifyOtpCode } from "@/lib/otp";

const schema = z.object({
  identifier: z.string().min(1),
  code: z.string().length(6),
  channel: z.nativeEnum(OtpChannel),
  type: z.nativeEnum(OtpType),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, code, channel, type } = schema.parse(body);

    const result = await verifyOtpCode(identifier, code, type, channel);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ verified: true, token: result.verifiedToken ?? null });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues }, { status: 400 });
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
