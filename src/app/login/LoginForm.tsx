"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Leaf, Loader2, Eye, EyeOff, Smartphone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});
type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("callbackUrl") || "/";
  const callbackUrl = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
  const justVerified = searchParams.get("verified") === "1";

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tab, setTab] = useState<"password" | "otp">("password");

  // OTP state
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    setLoading(false);
    if (result?.error === "UNVERIFIED") {
      toast.error("Verify your email and phone first. Check your inbox.");
    } else if (result?.error) {
      toast.error("Invalid email or password");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  function startCooldown() {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(60);
    cooldownRef.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  function normalizePhone(val: string) {
    if (val.includes("@")) return val;
    const digits = val.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    return val;
  }

  async function sendOtp() {
    if (!otpIdentifier.trim()) return;
    const normalized = normalizePhone(otpIdentifier.trim());
    setOtpIdentifier(normalized);
    const channel = normalized.includes("@") ? "EMAIL" : "PHONE";
    setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: normalized, channel, type: "LOGIN_OTP" }),
      });
      const j = await res.json();
      if (res.ok) { setOtpSent(true); startCooldown(); toast.success("OTP sent!"); }
      else toast.error(j.error || "Failed to send OTP");
    } catch { toast.error("Something went wrong"); }
    finally { setOtpLoading(false); }
  }

  async function verifyOtp() {
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
        toast.error(verifyJson.error || "Invalid OTP");
        return;
      }
      const result = await signIn("credentials", { otpToken: verifyJson.token, redirect: false });
      if (result?.error === "UNVERIFIED") toast.error("Verify your account first.");
      else if (result?.error) toast.error("Login failed");
      else { router.push(callbackUrl); router.refresh(); }
    } catch { toast.error("Something went wrong"); }
    finally { setOtpLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#052e16] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 to-transparent pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-green-800/20 blur-3xl pointer-events-none" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl text-white">Gross<span className="text-green-400">Tech</span></span>
        </Link>

        <div className="relative">
          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            India&apos;s Wholesale
            <br />
            Marketplace
          </h2>
          <p className="text-green-300/70 text-sm leading-relaxed max-w-sm">
            Buy daily essentials at wholesale prices. Secure escrow payments, verified sellers, transparent pricing.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { value: "500+", label: "Products" },
              { value: "50+", label: "Sellers" },
              { value: "₹20", label: "Platform fee" },
              { value: "3 day", label: "Buyer protection" },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-xs text-green-300/60 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-green-800/60">© {new Date().getFullYear()} Gross Tech</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-lg text-gray-900">Gross<span className="text-green-600">Tech</span></span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-black text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6">Sign in to your account</p>

          {justVerified && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
              <span>✓</span> Account verified! You can now sign in.
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(["password", "otp"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "password" ? "Password" : "OTP Login"}
              </button>
            ))}
          </div>

          {tab === "password" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700">Password</label>
                  <Link href="/forgot-password" className="text-xs text-green-600 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1.5">
                  <Smartphone className="w-3.5 h-3.5 inline mr-1" />
                  Email or Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    value={otpIdentifier}
                    onChange={(e) => setOtpIdentifier(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    disabled={otpSent}
                    placeholder="email@example.com or 9876543210"
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50"
                  />
                  <button
                    onClick={sendOtp}
                    disabled={otpLoading || !otpIdentifier.trim() || cooldown > 0}
                    className="h-11 px-4 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all whitespace-nowrap"
                  >
                    {otpLoading && !otpSent ? <Loader2 className="w-4 h-4 animate-spin" /> : cooldown > 0 ? `${cooldown}s` : "Send OTP"}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1.5">Enter OTP</label>
                  <div className="flex gap-2">
                    <input
                      placeholder="000000"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                      className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white text-center text-lg tracking-[0.4em] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={verifyOtp}
                      disabled={otpLoading || otpCode.length !== 6}
                      className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                    >
                      {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  </div>
                  <div className="flex justify-between mt-2">
                    <button
                      onClick={() => { setOtpSent(false); setOtpCode(""); setOtpIdentifier(""); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Change contact
                    </button>
                    <button
                      onClick={sendOtp}
                      disabled={cooldown > 0}
                      className="text-xs text-green-600 hover:underline disabled:text-gray-400"
                    >
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            No account?{" "}
            <Link href="/signup" className="font-semibold text-green-600 hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
