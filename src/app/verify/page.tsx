"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Leaf, Loader2, CheckCircle2, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") || "";
  const phone = params.get("phone") || "";

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailCooldown, setEmailCooldown] = useState(60);
  const [phoneCooldown, setPhoneCooldown] = useState(60);
  const emailTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const phoneTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function startCooldown(type: "email" | "phone") {
    if (type === "email") {
      if (emailTimer.current) clearInterval(emailTimer.current);
      setEmailCooldown(60);
      emailTimer.current = setInterval(() => {
        setEmailCooldown((c) => {
          if (c <= 1) { clearInterval(emailTimer.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    } else {
      if (phoneTimer.current) clearInterval(phoneTimer.current);
      setPhoneCooldown(60);
      phoneTimer.current = setInterval(() => {
        setPhoneCooldown((c) => {
          if (c <= 1) { clearInterval(phoneTimer.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    }
  }

  useEffect(() => {
    startCooldown("email");
    startCooldown("phone");
    return () => {
      if (emailTimer.current) clearInterval(emailTimer.current);
      if (phoneTimer.current) clearInterval(phoneTimer.current);
    };
  }, []);

  async function resend(channel: "EMAIL" | "PHONE", type: "EMAIL_VERIFY" | "PHONE_VERIFY") {
    const identifier = channel === "EMAIL" ? email : phone;
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, channel, type }),
    });
    if (res.ok) {
      toast.success(`OTP sent to your ${channel === "EMAIL" ? "email" : "phone"}`);
      startCooldown(channel === "EMAIL" ? "email" : "phone");
    } else {
      const j = await res.json();
      toast.error(j.error || "Failed to send OTP");
    }
  }

  async function verifyChannel(channel: "EMAIL" | "PHONE", code: string) {
    const identifier = channel === "EMAIL" ? email : phone;
    const type = channel === "EMAIL" ? "EMAIL_VERIFY" : "PHONE_VERIFY";
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, code, channel, type }),
    });
    const j = await res.json();
    if (res.ok && j.verified) {
      if (channel === "EMAIL") setEmailVerified(true);
      else setPhoneVerified(true);
      toast.success(`${channel === "EMAIL" ? "Email" : "Phone"} verified!`);
    } else {
      toast.error(j.error || "Invalid OTP");
    }
  }

  async function handleVerifyAll() {
    setLoading(true);
    try {
      if (!emailVerified && emailCode.length === 6) await verifyChannel("EMAIL", emailCode);
      if (!phoneVerified && phoneCode.length === 6) await verifyChannel("PHONE", phoneCode);
    } finally {
      setLoading(false);
    }
  }

  const eitherVerified = emailVerified || phoneVerified;

  function proceed() {
    router.push("/");
    router.refresh();
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
          <p className="text-slate-500 mt-2 text-sm">Verify your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <p className="text-slate-600 text-sm text-center">
            Verify your email or phone number to continue. At least one is required.
          </p>

          {/* Email OTP */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Mail className="w-4 h-4" />
              Email OTP
              {emailVerified && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
            <p className="text-xs text-slate-400 truncate">{email}</p>
            {!emailVerified ? (
              <>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && emailCode.length === 6 && verifyChannel("EMAIL", emailCode)}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={emailCooldown > 0}
                    onClick={() => resend("EMAIL", "EMAIL_VERIFY")}
                    className="text-xs text-green-600 disabled:text-slate-400 hover:underline"
                  >
                    {emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    disabled={emailCode.length !== 6}
                    onClick={() => verifyChannel("EMAIL", emailCode)}
                    className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg disabled:opacity-50 hover:bg-green-100"
                  >
                    Verify email
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-green-600 font-medium">Email verified</p>
            )}
          </div>

          {/* Phone OTP */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Phone className="w-4 h-4" />
              Phone OTP
              {phoneVerified && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
            </div>
            <p className="text-xs text-slate-400">{phone}</p>
            {!phoneVerified ? (
              <>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={phoneCode}
                  onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && phoneCode.length === 6 && verifyChannel("PHONE", phoneCode)}
                  className="text-center text-lg tracking-widest font-mono"
                />
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    disabled={phoneCooldown > 0}
                    onClick={() => resend("PHONE", "PHONE_VERIFY")}
                    className="text-xs text-green-600 disabled:text-slate-400 hover:underline"
                  >
                    {phoneCooldown > 0 ? `Resend in ${phoneCooldown}s` : "Resend OTP"}
                  </button>
                  <button
                    type="button"
                    disabled={phoneCode.length !== 6}
                    onClick={() => verifyChannel("PHONE", phoneCode)}
                    className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-lg disabled:opacity-50 hover:bg-green-100"
                  >
                    Verify phone
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-green-600 font-medium">Phone verified</p>
            )}
          </div>

          {eitherVerified ? (
            <Button onClick={proceed} className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Continue to Dashboard
            </Button>
          ) : (
            <Button
              onClick={handleVerifyAll}
              disabled={loading || (emailCode.length !== 6 && phoneCode.length !== 6)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Verify
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
