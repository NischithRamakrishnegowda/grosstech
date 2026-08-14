import Link from "next/link";
import { ShieldCheck, Users, TrendingUp, BadgeCheck, ArrowRight } from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Secure & Transparent",
    description: "Funds held in escrow for 3 days post-delivery. Every transaction is protected.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "We connect local sellers with buyers, supporting small businesses across India.",
  },
  {
    icon: TrendingUp,
    title: "Best Prices",
    description: "Direct seller-to-buyer model. Only ₹20 flat platform fee per order.",
  },
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    description: "All sellers are manually verified. Products are exactly as described.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left copy */}
          <div className="animate-fade-up">
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-3">About Us</p>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              A Trusted B2B Marketplace<br />for Daily Essentials
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Gross Tech was built to simplify how businesses buy daily essentials like rice, sugar,
              and oil in bulk. We eliminate middlemen, connect buyers directly with verified local sellers,
              and ensure every transaction is safe and transparent.
            </p>
            <p className="mt-3 text-slate-500 leading-relaxed text-sm">
              Whether you&apos;re stocking up your kirana store or buying wholesale for your business,
              Gross Tech gives you access to the best prices with the security of our escrow payment system.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Browse Products <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/signup?role=SELLER"
                className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Become a Seller
              </Link>
            </div>
          </div>

          {/* Right values grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-up [animation-delay:150ms]">
            {values.map((val) => (
              <div key={val.title} className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                  <val.icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">{val.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
