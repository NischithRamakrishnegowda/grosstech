"use client";

import { useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Leaf, Loader2, Eye, EyeOff, MapPin, ArrowRight, Building2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const indianPhone = /^(\+91|91)?[6-9]\d{9}$/;

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand",
  "Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura",
  "Uttar Pradesh","Uttarakhand","West Bengal",
  "Delhi","Jammu & Kashmir","Ladakh","Puducherry",
  "Chandigarh","Andaman & Nicobar Islands","Dadra & Nagar Haveli and Daman & Diu","Lakshadweep",
];

const schema = z.object({
  name: z.string().min(2, "At least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["BUYER", "SELLER"]),
  phone: z.string().regex(indianPhone, "Enter a valid Indian mobile number"),
  businessName: z.string().optional(),
  street: z.string().min(3, "Street address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(1, "Select a state"),
  pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit pincode required"),
  panNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
  gstNumber: z.string().optional(),
  declaration: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

// Reusable field components
function Field({ label, error, children, hint }: { label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-700 block mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputClass = "w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all";
const selectClass = "w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all appearance-none";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") === "SELLER" ? "SELLER" : "BUYER";

  const [loading, setLoading] = useState(false);
  const [rawPhone, setRawPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
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
        toast.error("Pincode not found — fill city and state manually");
      }
    } catch {
      toast.error("Could not fetch pincode — fill manually");
    } finally {
      setPincodeLoading(false);
    }
  }, [setValue]);

  async function onSubmit(data: FormData) {
    if (data.role === "SELLER") {
      if (!data.panNumber || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(data.panNumber)) {
        toast.error("Enter a valid PAN number (e.g. ABCDE1234F)"); return;
      }
      if (!data.accountNumber || data.accountNumber.trim().length < 9) {
        toast.error("Bank account number is required"); return;
      }
      if (!data.ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode)) {
        toast.error("Enter a valid IFSC code (e.g. SBIN0001234)"); return;
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
      if (!res.ok) { toast.error(json.error || "Registration failed"); return; }
      router.push(`/verify?email=${encodeURIComponent(json.email)}&phone=${encodeURIComponent(json.phone || "")}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-gray-900">Gross<span className="text-green-600">Tech</span></span>
          </Link>
          <p className="text-sm text-gray-500">
            Have an account?{" "}
            <Link href="/login" className="font-semibold text-green-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-1">Join thousands of buyers and sellers on India&apos;s wholesale marketplace</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3">
            {(["BUYER", "SELLER"] as const).map((r) => (
              <label
                key={r}
                className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  role === r
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input type="radio" value={r} {...register("role")} className="sr-only" />
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  role === r ? "bg-green-100" : "bg-gray-100"
                }`}>
                  {r === "BUYER"
                    ? <ShoppingBag className={`w-5 h-5 ${role === r ? "text-green-600" : "text-gray-400"}`} />
                    : <Building2 className={`w-5 h-5 ${role === r ? "text-green-600" : "text-gray-400"}`} />
                  }
                </div>
                <div>
                  <div className={`text-sm font-bold ${role === r ? "text-green-700" : "text-gray-800"}`}>
                    {r === "BUYER" ? "Buyer" : "Seller"}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {r === "BUYER" ? "Purchase wholesale goods" : "List your products"}
                  </div>
                </div>
                {role === r && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </label>
            ))}
          </div>

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Personal Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.name?.message}>
                <input placeholder="Your full name" {...register("name")} className={inputClass} />
              </Field>
              <Field label="Email Address *" error={errors.email?.message}>
                <input type="email" placeholder="you@example.com" {...register("email")} className={inputClass} />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone Number *" error={errors.phone?.message}>
                <div className="flex">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={rawPhone}
                    onChange={handlePhoneChange}
                    maxLength={10}
                    className="flex-1 h-11 px-4 rounded-r-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  />
                </div>
              </Field>

              <Field label="Password *" error={errors.password?.message}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    {...register("password")}
                    className={`${inputClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
            </div>

            {role === "SELLER" && (
              <Field label="Business / Shop Name">
                <input placeholder="e.g. Sharma Traders" {...register("businessName")} className={inputClass} />
              </Field>
            )}
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-green-600" /> Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field
                label={`Pincode * ${pincodeLoading ? "— fetching…" : ""}`}
                error={errors.pincode?.message}
              >
                <input
                  placeholder="560001"
                  maxLength={6}
                  {...register("pincode")}
                  onChange={handlePincodeChange}
                  className={inputClass}
                />
              </Field>
              <Field label="City / District *" error={errors.city?.message}>
                <input placeholder="Auto-filled from pincode" {...register("city")} className={inputClass} />
              </Field>
              <Field label="State *" error={errors.state?.message}>
                <select {...register("state")} className={selectClass}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Street / Area *" error={errors.street?.message}>
              <input placeholder="House no., Street, Area, Landmark" {...register("street")} className={inputClass} />
            </Field>
          </div>

          {/* Seller-only: KYC + Payment */}
          {role === "SELLER" && (
            <>
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">KYC & Payment Details</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Required to receive payouts from the platform</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="PAN Number *" error={errors.panNumber?.message} hint="10-character PAN e.g. ABCDE1234F">
                    <input
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      {...register("panNumber", { onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })}
                      className={`${inputClass} uppercase font-mono tracking-widest`}
                    />
                  </Field>
                  <Field label="UPI ID" error={errors.upiId?.message} hint="Optional — for quick payouts">
                    <input placeholder="yourbusiness@upi" {...register("upiId")} className={inputClass} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Bank Account Number *" error={errors.accountNumber?.message}>
                    <input placeholder="1234567890123" {...register("accountNumber")} className={inputClass} />
                  </Field>
                  <Field label="IFSC Code *" error={errors.ifscCode?.message} hint="11-character e.g. SBIN0001234">
                    <input
                      placeholder="SBIN0001234"
                      maxLength={11}
                      {...register("ifscCode", { onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })}
                      className={`${inputClass} uppercase font-mono tracking-widest`}
                    />
                  </Field>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">GST & Declaration <span className="text-gray-400 font-normal">(optional)</span></h3>
                </div>
                <Field label="GST Number" hint="15-character GST if registered e.g. 22ABCDE1234F1Z5">
                  <input
                    placeholder="22ABCDE1234F1Z5"
                    maxLength={15}
                    {...register("gstNumber", { onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })}
                    className={`${inputClass} uppercase font-mono`}
                  />
                </Field>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-0.5 accent-green-600 w-4 h-4 rounded" {...register("declaration")} />
                  <span className="text-xs text-gray-500 leading-relaxed">
                    I confirm that the information provided is accurate. I understand that false details may result in account suspension.
                  </span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <>Create Account <ArrowRight className="w-4 h-4" /></>
            }
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            By creating an account you agree to our terms of service.
          </p>
        </form>
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
