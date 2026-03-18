"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const indianPhone = /^(\+91|91)?[6-9]\d{9}$/;

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["BUYER", "SELLER"]),
  phone: z.string().regex(indianPhone, "Enter a valid Indian mobile number"),
  businessName: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole = roleParam === "SELLER" ? "SELLER" : "BUYER";
  const [loading, setLoading] = useState(false);
  const [rawPhone, setRawPhone] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const role = watch("role");

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setRawPhone(digits);
    setValue("phone", digits ? `+91${digits}` : "", { shouldValidate: true });
  }

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Registration failed");
        return;
      }

      // Sign in immediately, then redirect to verify page
      await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      router.push(`/verify?email=${encodeURIComponent(json.email)}&phone=${encodeURIComponent(json.phone || "")}`);
      router.refresh();
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
          <Link href="/" className="inline-flex items-center gap-2 text-green-700 font-bold text-2xl">
            <Package className="w-7 h-7" />
            Gross<span className="text-gray-800">Tech</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2">
              {(["BUYER", "SELLER"] as const).map((r) => (
                <label
                  key={r}
                  className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-all ${
                    role === r
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input type="radio" value={r} {...register("role")} className="sr-only" />
                  <div className="font-semibold text-sm">{r === "BUYER" ? "I want to buy" : "I want to sell"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {r === "BUYER" ? "Find & purchase goods" : "List your products"}
                  </div>
                </label>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Your name" required {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="you@example.com" required {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground select-none">
                  +91
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="90000 00000"
                  value={rawPhone}
                  onChange={handlePhoneChange}
                  className="rounded-l-none"
                  maxLength={10}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            {role === "SELLER" && (
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" placeholder="Your business name" {...register("businessName")} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <Input id="password" type="password" placeholder="Min. 6 characters" required {...register("password")} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 font-medium hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
