"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Leaf, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [loading, setLoading] = useState(false);

  // OTP login state
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      toast.error("Invalid email or password");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  function startCooldown() {
    setCooldown(60);
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function sendOtp() {
    if (!otpIdentifier.trim()) return;
    const channel = otpIdentifier.includes("@") ? "EMAIL" : "PHONE";
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: otpIdentifier, channel, type: "LOGIN_OTP" }),
      });
      const j = await res.json();
      if (res.ok) {
        setOtpSent(true);
        startCooldown();
        toast.success(`OTP sent to your ${channel === "EMAIL" ? "email" : "phone"}`);
      } else {
        toast.error(j.error || "Failed to send OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtpAndLogin() {
    if (otpCode.length !== 6) return;
    const channel = otpIdentifier.includes("@") ? "EMAIL" : "PHONE";
    setOtpLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: otpIdentifier, code: otpCode, channel, type: "LOGIN_OTP" }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.verified) {
        toast.error(verifyJson.error || "Invalid or expired OTP");
        return;
      }

      const result = await signIn("credentials", {
        otpToken: verifyJson.token,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Login failed");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">GrossTech</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Password login */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-green-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-white px-3">or quick login with OTP</span>
            </div>
          </div>

          {/* OTP login */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Smartphone className="w-4 h-4 text-green-600" />
              Login with OTP
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Email or phone number"
                value={otpIdentifier}
                onChange={(e) => setOtpIdentifier(e.target.value)}
                disabled={otpSent}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={sendOtp}
                disabled={otpLoading || !otpIdentifier.trim() || cooldown > 0}
                className="shrink-0"
              >
                {otpLoading && !otpSent ? <Loader2 className="w-4 h-4 animate-spin" /> : cooldown > 0 ? `${cooldown}s` : "Send OTP"}
              </Button>
            </div>

            {otpSent && (
              <div className="flex gap-2">
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-lg tracking-widest font-mono flex-1"
                />
                <Button
                  type="button"
                  onClick={verifyOtpAndLogin}
                  disabled={otpLoading || otpCode.length !== 6}
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            )}

            {otpSent && (
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => { setOtpSent(false); setOtpCode(""); setOtpIdentifier(""); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Change contact
                </button>
                <button
                  onClick={sendOtp}
                  disabled={cooldown > 0}
                  className="text-green-600 disabled:text-slate-400 hover:underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </div>
            )}
          </div>

          <div className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-green-600 font-medium hover:underline">Sign up</Link>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">Demo accounts:</p>
            <p>Admin: admin@grosstech.com / admin123</p>
            <p>Seller: seller@grosstech.com / seller123</p>
            <p>Buyer: buyer@grosstech.com / buyer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
