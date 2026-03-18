import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { OtpType, OtpChannel } from "@prisma/client";

export function generateOtpCode(): string {
  // Use CSPRNG: random value in [0, 900000) + 100000 = [100000, 999999]
  return (100000 + (crypto.randomInt(900000))).toString();
}

export async function generateAndSaveOtp(
  userId: string,
  type: OtpType,
  channel: OtpChannel
): Promise<string> {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate previous unused tokens of same type+channel for this user
  await prisma.otpToken.updateMany({
    where: { userId, type, channel, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.otpToken.create({
    data: { userId, code, type, channel, expiresAt },
  });

  return code;
}

export async function verifyOtpCode(
  identifier: string, // email or phone
  code: string,
  type: OtpType,
  channel: OtpChannel
): Promise<{ success: boolean; userId?: string; verifiedToken?: string; error?: string }> {
  // Find user by email or phone
  const user = await prisma.user.findFirst({
    where: channel === OtpChannel.EMAIL ? { email: identifier } : { phone: identifier },
  });

  if (!user) return { success: false, error: "User not found" };

  // Find valid OTP
  const token = await prisma.otpToken.findFirst({
    where: {
      userId: user.id,
      code,
      type,
      channel,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!token) return { success: false, error: "Invalid or expired OTP" };

  // Mark as used
  let verifiedToken: string | undefined;

  if (type === OtpType.PASSWORD_RESET || type === OtpType.LOGIN_OTP) {
    verifiedToken = `vt_${crypto.randomBytes(24).toString("hex")}`;
    const tokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date(), verifiedToken, expiresAt: tokenExpiresAt },
    });
  } else {
    await prisma.otpToken.update({
      where: { id: token.id },
      data: { usedAt: new Date() },
    });

    // Update verified flags
    if (type === OtpType.EMAIL_VERIFY) {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    } else if (type === OtpType.PHONE_VERIFY) {
      await prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    }
  }

  return { success: true, userId: user.id, verifiedToken };
}

export async function validateVerifiedToken(
  verifiedToken: string,
  type: OtpType
): Promise<{ valid: boolean; userId?: string }> {
  const token = await prisma.otpToken.findFirst({
    where: {
      verifiedToken,
      type,
      expiresAt: { gt: new Date() },
    },
  });

  if (!token) return { valid: false };
  return { valid: true, userId: token.userId };
}
