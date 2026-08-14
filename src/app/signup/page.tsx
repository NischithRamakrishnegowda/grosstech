"use client";

import { useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Loader2, Eye, EyeOff, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const indianPhone = /^(\+91|91)?[6-9]\d{9}$/;

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
  "Chandigarh", "Andaman & Nicobar Islands", "Dadra & Nagar Haveli and Daman & Diu", "Lakshadweep",
];

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["BUYER", "SELLER"]),
  phone: z.string().regex(indianPhone, "Enter a valid Indian mobile number"),
  businessName: z.string().optional(),
  street: z.string().min(3, "Street address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(1, "Please select a state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  // Seller mandatory
  panNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  // Optional
  upiId: z.string().optional(),
  gstNumber: z.string().optional(),
  declaration: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultRole = roleParam === "SELLER" ? "SELLER" : "BUYER";

  const [loading, setLoading] = useState(false);
  const [rawPhone, setRawPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole, state: "", declaration: false },
  });

  const role = watch("role");

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setRawPhone(digits);
    setValue("phone", digits ? `+91${digits}` : "", { shouldValidate: true });
  }

  const handlePincodeChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setValue("pincode", val, { shouldValidate: val.length === 6 });

    if (val.length !== 6) return;

    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${val}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success") {
        const post = data[0].PostOffice?.[0];
        if (post) {
          setValue("city", post.District, { shouldValidate: true });
          setValue("state", post.State, { shouldValidate: true });
          toast.success(`${post.District}, ${post.State}`);
        }
      } else {
        toast.error("Pincode not found. Please fill city and state manually.");
      }
    } catch {
      toast.error("Could not fetch pincode details. Please fill manually.");
    } finally {
      setPincodeLoading(false);
    }
  }, [setValue]);

  async function onSubmit(data: FormData) {
    // Client-side seller validation
    if (data.role === "SELLER") {
      if (!data.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.panNumber)) {
        toast.error("Enter a valid PAN number (e.g. ABCDE1234F)");
        return;
      }
      if (!data.accountNumber || data.accountNumber.trim().length < 9) {
        toast.error("Bank account number is required");
        return;
      }
      if (!data.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode)) {
        toast.error("Enter a valid IFSC code (e.g. SBIN0001234)");
        return;
      }
    }

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
      router.push(`/verify?email=${encodeURIComponent(json.email)}&phone=${encodeURIComponent(json.phone || "")}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-green-700 font-bold text-2xl">
            <Package className="w-7 h-7" />
            Gross<span className="text-gray-800">Tech</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2">
              {(["BUYER", "SELLER"] as const).map((r) => (
                <label
                  key={r}
                  className={`border-2 rounded-xl p-3 cursor-pointer text-center transition-all ${
                    role === r ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 hover:border-gray-300"
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

            {/* Basic Info */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" placeholder="Your name" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
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
                <Input id="businessName" placeholder="Your business / shop name" {...register("businessName")} />
              </div>
            )}

            {/* Address */}
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-green-600" /> Address
              </p>
              <div className="space-y-3">

                {/* Pincode first — triggers auto-fill */}
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">
                    Pincode *
                    {pincodeLoading && <span className="text-xs text-green-600 ml-2 animate-pulse">Fetching location...</span>}
                  </Label>
                  <Input
                    id="pincode"
                    placeholder="560001"
                    maxLength={6}
                    {...register("pincode")}
                    onChange={handlePincodeChange}
                  />
                  {errors.pincode && <p className="text-xs text-red-500">{errors.pincode.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City / District *</Label>
                    <Input id="city" placeholder="Auto-filled from pincode" {...register("city")} />
                    {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State *</Label>
                    <select
                      id="state"
                      {...register("state")}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="street">Street / Area *</Label>
                  <Input id="street" placeholder="House no., Street, Area, Landmark" {...register("street")} />
                  {errors.street && <p className="text-xs text-red-500">{errors.street.message}</p>}
                </div>
              </div>
            </div>

            {/* Seller — mandatory payment + compliance */}
            {role === "SELLER" && (
              <>
                {/* Mandatory: PAN + Bank */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Payment & KYC Details *</p>
                  <p className="text-xs text-gray-400 mb-3">Required to receive payouts from the platform</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="panNumber">PAN Number *</Label>
                      <Input
                        id="panNumber"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className="uppercase"
                        {...register("panNumber", {
                          onChange: (e) => {
                            e.target.value = e.target.value.toUpperCase();
                          }
                        })}
                      />
                      <p className="text-xs text-gray-400">10-character PAN (e.g. ABCDE1234F)</p>
                      {errors.panNumber && <p className="text-xs text-red-500">{errors.panNumber.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="accountNumber">Bank Account Number *</Label>
                      <Input id="accountNumber" placeholder="1234567890" {...register("accountNumber")} />
                      {errors.accountNumber && <p className="text-xs text-red-500">{errors.accountNumber.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ifscCode">IFSC Code *</Label>
                      <Input
                        id="ifscCode"
                        placeholder="SBIN0001234"
                        maxLength={11}
                        className="uppercase"
                        {...register("ifscCode", {
                          onChange: (e) => {
                            e.target.value = e.target.value.toUpperCase();
                          }
                        })}
                      />
                      <p className="text-xs text-gray-400">11-character bank IFSC (e.g. SBIN0001234)</p>
                      {errors.ifscCode && <p className="text-xs text-red-500">{errors.ifscCode.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="upiId">UPI ID <span className="text-gray-400 font-normal">(optional)</span></Label>
                      <Input id="upiId" placeholder="yourbusiness@upi" {...register("upiId")} />
                    </div>
                  </div>
                </div>

                {/* Optional: GST + Declaration */}
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-1">GST & Declaration <span className="text-gray-400 font-normal text-xs">(optional)</span></p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="gstNumber">GST Number</Label>
                      <Input
                        id="gstNumber"
                        placeholder="22ABCDE1234F1Z5"
                        maxLength={15}
                        className="uppercase"
                        {...register("gstNumber", {
                          onChange: (e) => {
                            e.target.value = e.target.value.toUpperCase();
                          }
                        })}
                      />
                      <p className="text-xs text-gray-400">15-character GST number if registered</p>
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-green-600"
                        {...register("declaration")}
                      />
                      <span className="text-xs text-gray-500 leading-relaxed">
                        I declare that the information provided is accurate and I agree to the platform&apos;s terms. I understand that false information may lead to account suspension.
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  {...register("password")}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
