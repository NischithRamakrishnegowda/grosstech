import Link from "next/link";
import { ShieldCheck, IndianRupee, BadgeCheck, Users } from "lucide-react";

const VALUES = [
  { icon: ShieldCheck,   label: "Escrow protected",   desc: "Your payment is safe until delivery"   },
  { icon: IndianRupee,   label: "₹20 flat fee",       desc: "No hidden charges ever"                },
  { icon: BadgeCheck,    label: "Verified sellers",   desc: "Every seller manually reviewed"        },
  { icon: Users,         label: "1000+ buyers",       desc: "Active community of businesses"        },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-12 bg-gray-50 border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          <div>
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-3">About</p>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-4">
              Built for India&apos;s<br />Wholesale Businesses
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-6">
              GrossTech connects buyers directly with verified sellers of daily essentials — rice, sugar, oil, dal and more.
              No middlemen. Transparent pricing. Secure escrow payments that protect both sides.
            </p>
            <div className="flex gap-3">
              <Link href="/products" className="h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors flex items-center">
                Browse Products
              </Link>
              <Link href="/signup?role=SELLER" className="h-10 px-5 rounded-xl border border-gray-200 text-gray-700 hover:border-primary-300 font-semibold text-sm transition-all flex items-center">
                Sell on GrossTech
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((v) => (
              <div key={v.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                  <v.icon className="w-4.5 h-4.5 text-primary-600" />
                </div>
                <p className="text-sm font-bold text-gray-900">{v.label}</p>
                <p className="text-xs text-gray-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
