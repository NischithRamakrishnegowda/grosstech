import Link from "next/link";
import { ShieldCheck, BadgeCheck, IndianRupee } from "lucide-react";

const FEATURES = [
  { icon: ShieldCheck,  text: "Escrow Payments"     },
  { icon: BadgeCheck,   text: "Verified Sellers"    },
  { icon: IndianRupee,  text: "₹20 Flat Fee"        },
];

export default function HeroSection() {
  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-primary-100">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          India&apos;s B2B Wholesale Marketplace
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-4">
          Buy Daily Essentials
          <br />
          <span className="text-primary-600">at Wholesale Prices</span>
        </h1>

        <p className="text-gray-500 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          Rice, sugar, oil, dal and more — direct from verified sellers.
          Secure payments, transparent pricing.
        </p>

        {/* Search */}
        <form action="/products" method="GET" className="max-w-2xl mx-auto mb-6">
          <div className="flex gap-0 rounded-2xl border-2 border-primary-600 overflow-hidden bg-white shadow-md shadow-primary-100">
            <input
              name="search"
              type="text"
              placeholder="Search for rice, dal, sugar, oil…"
              className="flex-1 h-14 px-5 text-sm text-gray-800 placeholder:text-gray-400 bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="h-14 px-8 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shrink-0"
            >
              Search
            </button>
          </div>
        </form>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {FEATURES.map(({ icon: Icon, text }) => (
            <span key={text} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
              <Icon className="w-3.5 h-3.5 text-primary-500 shrink-0" />
              {text}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/products"
            className="h-11 px-7 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors"
          >
            Browse Products
          </Link>
          <Link
            href="/signup?role=SELLER"
            className="h-11 px-7 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 font-bold text-sm transition-all"
          >
            Start Selling
          </Link>
        </div>
      </div>

      {/* Stats strip */}
      <div className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 divide-x divide-gray-200 py-4">
            {[
              { value: "500+",  label: "Products"    },
              { value: "50+",   label: "Sellers"     },
              { value: "1000+", label: "Buyers"      },
            ].map((s) => (
              <div key={s.label} className="text-center py-1">
                <div className="text-xl font-black text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
