import Link from "next/link";
import { ShieldCheck, Users, IndianRupee, BadgeCheck, ArrowRight } from "lucide-react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Escrow Protection",
    description: "Your payment is held safely until you confirm delivery. Zero risk.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: Users,
    title: "Community First",
    description: "We support local sellers across India — no big corporate middlemen.",
    color: "text-purple-600 bg-purple-50",
  },
  {
    icon: IndianRupee,
    title: "₹20 Flat Fee",
    description: "One small fee per order. No hidden charges, no subscription.",
    color: "text-green-600 bg-green-50",
  },
  {
    icon: BadgeCheck,
    title: "Verified Sellers",
    description: "Every seller is manually reviewed and approved before going live.",
    color: "text-amber-600 bg-amber-50",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-3">Why Us</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">
              Built for India&apos;s
              <br />
              Wholesale Businesses
            </h2>
            <p className="text-gray-500 leading-relaxed mb-3">
              Gross Tech eliminates the middleman between businesses and their daily essential suppliers.
              Whether you&apos;re a kirana store owner, caterer, or wholesaler — we have the supply you need.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Our escrow-based payment system means sellers only get paid when you&apos;re satisfied.
              Every rupee is protected.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                Browse Products <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/signup?role=SELLER"
                className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
              >
                Become a Seller
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((val) => (
              <div key={val.title} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:border-gray-200 hover:bg-white transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${val.color}`}>
                  <val.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{val.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
