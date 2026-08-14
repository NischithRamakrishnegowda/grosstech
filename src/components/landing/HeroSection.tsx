import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, BadgeCheck } from "lucide-react";

const TRUST = [
  { icon: ShieldCheck, text: "Escrow Protected Payments" },
  { icon: Truck,       text: "Bulk & Retail Both" },
  { icon: BadgeCheck,  text: "Admin-Verified Sellers" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#052e16]">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-green-800/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-900/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-green-900/20 to-teal-900/20 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-3xl mx-auto text-center">

          {/* Eyebrow pill */}
          <div className="inline-flex items-center gap-2 bg-green-900/60 border border-green-700/50 text-green-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            India&apos;s Wholesale Marketplace
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.05] tracking-tight mb-5">
            Buy & Sell Daily
            <br />
            <span className="text-green-400">Essentials</span> at Wholesale
          </h1>

          <p className="text-base sm:text-lg text-green-200/80 max-w-xl mx-auto leading-relaxed mb-8">
            Rice, sugar, oil, dal and more — direct from verified sellers. Secure escrow payments. Best wholesale prices.
          </p>

          {/* Search bar */}
          <form action="/products" method="GET" className="relative max-w-xl mx-auto mb-8">
            <input
              name="search"
              type="text"
              placeholder="Search for rice, dal, oil, sugar…"
              className="w-full h-14 pl-5 pr-36 rounded-2xl text-gray-900 text-sm font-medium placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-green-400 shadow-xl"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 h-10 px-5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              Search <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/products"
              className="h-11 px-7 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-green-900/50 flex items-center gap-2"
            >
              Browse Products <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup?role=SELLER"
              className="h-11 px-7 rounded-xl border border-green-700/60 text-green-300 hover:bg-green-900/40 font-semibold text-sm transition-all flex items-center gap-2"
            >
              Start Selling
            </Link>
          </div>

          {/* Trust signals */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-green-300/80 text-xs font-medium">
                <Icon className="w-4 h-4 text-green-400 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="relative border-t border-green-900/60 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-green-900/60 py-4">
            {[
              { value: "500+", label: "Products" },
              { value: "50+", label: "Sellers" },
              { value: "₹20", label: "Flat Platform Fee" },
            ].map((s) => (
              <div key={s.label} className="text-center py-1">
                <div className="text-xl sm:text-2xl font-black text-white">{s.value}</div>
                <div className="text-[11px] text-green-400/70 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
