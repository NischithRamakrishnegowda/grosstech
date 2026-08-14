"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Loader2, Eye, EyeOff, MapPin, CreditCard, User, Lock, Camera } from "lucide-react";
import { ImageUpload } from "@/components/ui/ImageUpload";
import Image from "next/image";
import { toast } from "sonner";

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

const inputClass = "w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-400";
const selectClass = "w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600 block mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-green-600" /> {title}
      </h2>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Profile fields
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");

  // Password fields
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        setProfileImageUrl(data.profileImageUrl || null);
        setName(data.name || "");
        setPhone(data.phone?.replace(/^\+91/, "") || "");
        setBusinessName(data.businessName || "");
        setStreet(data.street || "");
        setCity(data.city || "");
        setState(data.state || "");
        setPincode(data.pincode || "");
        setUpiId(data.upiId || "");
        setAccountNumber(data.accountNumber || "");
        setIfscCode(data.ifscCode || "");
        setPanNumber(data.panNumber || "");
        setGstNumber(data.gstNumber || "");
        setLoading(false);
      });
  }, [session]);

  const handlePincodeChange = useCallback(async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setPincode(clean);
    if (clean.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
      const data = await res.json();
      if (data?.[0]?.Status === "Success") {
        const post = data[0].PostOffice?.[0];
        if (post) { setCity(post.District); setState(post.State); }
      }
    } catch { /* ignore */ }
    finally { setPincodeLoading(false); }
  }, []);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          profileImageUrl,
          phone: phone ? `+91${phone.replace(/\D/g, "")}` : undefined,
          businessName: businessName || undefined,
          street: street || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
          upiId: upiId || undefined,
          accountNumber: accountNumber || undefined,
          ifscCode: ifscCode || undefined,
          panNumber: panNumber || undefined,
          gstNumber: gstNumber || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed to save"); return; }
      toast.success("Profile updated");
    } catch { toast.error("Something went wrong"); }
    finally { setSaving(false); }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) { toast.error("Fill all password fields"); return; }
    if (newPw !== confirmPw) { toast.error("New passwords don't match"); return; }
    if (newPw.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    setChangingPw(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed"); return; }
      toast.success("Password changed successfully");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch { toast.error("Something went wrong"); }
    finally { setChangingPw(false); }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      </div>
    );
  }

  const role = session?.user.role;
  const isSeller = role === "SELLER";
  const isBuyer = role === "BUYER";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5">

        {/* Profile photo + name header */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {profileImageUrl ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden relative border border-gray-100">
                <Image src={profileImageUrl} alt="Profile" fill className="object-cover" sizes="64px" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-100">
                <User className="w-7 h-7 text-gray-300" />
              </div>
            )}
            <label className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:bg-green-700 transition-colors">
              <Camera className="w-3 h-3 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  if (res.ok) { const { url } = await res.json(); setProfileImageUrl(url); }
                }}
              />
            </label>
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">{name || "My Profile"}</h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{role?.toLowerCase()} · {session?.user.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Tap the camera icon to update photo</p>
          </div>
        </div>

        {/* Basic Info */}
        <Section title="Personal Information" icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </Field>
            <Field label="Email">
              <input value={session?.user.email || ""} disabled className={inputClass} />
            </Field>
            <Field label="Phone">
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 select-none">+91</span>
                <input
                  type="tel" maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="9876543210"
                  className="flex-1 h-10 px-3 rounded-r-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                />
              </div>
            </Field>
            {isSeller && (
              <Field label="Business Name">
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business / shop name" className={inputClass} />
              </Field>
            )}
          </div>
        </Section>

        {/* Address — buyers and sellers */}
        {(isBuyer || isSeller) && (
          <Section title="Address" icon={MapPin}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label={`Pincode${pincodeLoading ? " — fetching…" : ""}`}>
                  <input
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="560001" maxLength={6}
                    className={inputClass}
                  />
                </Field>
                <Field label="City / District">
                  <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Auto-filled" className={inputClass} />
                </Field>
                <Field label="State" >
                  <select value={state} onChange={(e) => setState(e.target.value)} className={selectClass}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Street / Area">
                <input value={street} onChange={(e) => setStreet(e.target.value)} placeholder="House no., Street, Area, Landmark" className={inputClass} />
              </Field>
            </div>
          </Section>
        )}

        {/* Seller — KYC & Payment */}
        {isSeller && (
          <Section title="KYC & Payment Details" icon={CreditCard}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="PAN Number" hint="10-character e.g. ABCDE1234F">
                <input
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F" maxLength={10}
                  className={`${inputClass} uppercase font-mono tracking-widest`}
                />
              </Field>
              <Field label="UPI ID" hint="Optional">
                <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourbusiness@upi" className={inputClass} />
              </Field>
              <Field label="Bank Account Number">
                <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567890" className={inputClass} />
              </Field>
              <Field label="IFSC Code" hint="11-character e.g. SBIN0001234">
                <input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="SBIN0001234" maxLength={11}
                  className={`${inputClass} uppercase font-mono tracking-widest`}
                />
              </Field>
              <Field label="GST Number" hint="Optional — 15-character if registered">
                <input
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                  placeholder="22ABCDE1234F1Z5" maxLength={15}
                  className={`${inputClass} uppercase font-mono`}
                />
              </Field>
            </div>
          </Section>
        )}

        {/* Save profile */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </button>

        {/* Change Password */}
        <Section title="Change Password" icon={Lock}>
          <div className="space-y-3">
            <Field label="Current Password">
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="••••••••" className={`${inputClass} pr-10`}
                />
                <button type="button" onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="New Password">
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw} onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min. 6 characters" className={`${inputClass} pr-10`}
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm New Password">
                <input
                  type="password"
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password" className={inputClass}
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={changingPw}
                className="h-10 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
              </button>
            </div>
          </div>
        </Section>

      </main>
      <Footer />
    </div>
  );
}
