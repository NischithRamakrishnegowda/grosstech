"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Step = "request" | "verify" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState<"EMAIL" | "PHONE">("EMAIL");
  const [code, setCode] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    if (!identifier.trim()) return;
    // Auto-detect channel
    const detectedChannel = identifier.includes("@") ? "EMAIL" : "PHONE";
    setChannel(detectedChannel);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, channel: detectedChannel, type: "PASSWORD_RESET" }),
      });
      const j = await res.json();
      if (res.ok) {
        toast.success(`OTP sent to your ${detectedChannel === "EMAIL" ? "email" : "phone"}`);
        setStep("verify");
      } else {
        toast.error(j.error || "Failed to send OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, code, channel, type: "PASSWORD_RESET" }),
      });
      const j = await res.json();
      if (res.ok && j.verified) {
        setVerifiedToken(j.token);
        setStep("reset");
      } else {
        toast.error(j.error || "Invalid or expired OTP");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifiedToken, newPassword }),
      });
      const j = await res.json();
      if (res.ok) {
        setStep("done");
        toast.success("Password reset successfully");
      } else {
        toast.error(j.error || "Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
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
          <p className="text-slate-500 mt-2 text-sm">Reset your password</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-8">
            {(["request", "verify", "reset"] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  step === s ? "bg-green-600 text-white" :
                  (["request", "verify", "reset", "done"].indexOf(step) > i) ? "bg-green-100 text-green-700" :
                  "bg-slate-100 text-slate-400"
                }`}>{i + 1}</div>
                {i < 2 && <div className={`flex-1 h-0.5 ${(["request", "verify", "reset", "done"].indexOf(step) > i) ? "bg-green-300" : "bg-slate-200"}`} />}
              </div>
            ))}
          </div>

          {step === "request" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-slate-900 mb-1">Enter your email or phone</h2>
                <p className="text-sm text-slate-500">We'll send a one-time password to verify your identity.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Email or Phone</Label>
                <Input
                  placeholder="you@example.com or 9000000000"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
              <Button onClick={handleSendOtp} disabled={loading || !identifier.trim()} className="w-full bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Send OTP
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-slate-900 mb-1">Enter the OTP</h2>
                <p className="text-sm text-slate-500">
                  Sent to <span className="text-slate-700 font-medium">{identifier}</span>
                </p>
              </div>
              <Input
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-widest font-mono"
              />
              <Button onClick={handleVerifyOtp} disabled={loading || code.length !== 6} className="w-full bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Verify OTP
              </Button>
              <button
                onClick={() => { setCode(""); setStep("request"); }}
                className="w-full text-sm text-slate-400 hover:text-slate-600"
              >
                Use a different email / phone
              </button>
            </div>
          )}

          {step === "reset" && (
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold text-slate-900 mb-1">Set a new password</h2>
                <p className="text-sm text-slate-500">Choose a strong password with at least 6 characters.</p>
              </div>
              <div className="space-y-1.5">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                />
              </div>
              <Button onClick={handleResetPassword} disabled={loading || !newPassword || !confirmPassword} className="w-full bg-green-600 hover:bg-green-700">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Reset Password
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h2 className="font-semibold text-slate-900">Password reset!</h2>
              <p className="text-sm text-slate-500">You can now log in with your new password.</p>
              <Button onClick={() => router.push("/login")} className="w-full bg-green-600 hover:bg-green-700">
                Go to Login
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Remembered it?{" "}
          <Link href="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
