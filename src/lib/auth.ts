import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { OtpType } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpToken: { label: "OTP Token", type: "text" },
        identifier: { label: "Identifier", type: "text" },
      },
      async authorize(credentials) {
        // OTP-based login
        if (credentials?.otpToken) {
          const token = await prisma.otpToken.findFirst({
            where: {
              verifiedToken: credentials.otpToken,
              type: OtpType.LOGIN_OTP,
              expiresAt: { gt: new Date() },
            },
          });
          if (!token) return null;

          const user = await prisma.user.findUnique({ where: { id: token.userId } });
          if (!user) return null;

          // Invalidate token
          await prisma.otpToken.update({
            where: { id: token.id },
            data: { verifiedToken: null },
          });

          return { id: user.id, name: user.name, email: user.email, role: user.role };
        }

        // Password-based login
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
