import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-sm px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
              Trusted by 1000+ buyers across India
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight">
              Fresh Essentials,
              <br />
              <span className="text-yellow-300">Delivered Fast</span>
            </h1>
            <p className="mt-4 text-lg text-green-100 max-w-lg">
              Buy rice, sugar, oil and daily staples directly from verified sellers.
              Best prices, transparent platform fee, secure payments.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button size="lg" className="bg-white text-green-700 hover:bg-green-50 font-semibold shadow-lg" asChild>
                <Link href="/products">
                  Shop Now <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 backdrop-blur-sm" asChild>
                <Link href="/signup?role=SELLER">Sell on Gross Tech</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: ShieldCheck, text: "Secure Payments" },
                { icon: Truck, text: "3-Day Hold Protection" },
                { icon: Star, text: "Verified Sellers" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-green-100 text-sm">
                  <Icon className="w-4 h-4 text-yellow-300" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Basmati Rice", price: "From ₹65", emoji: "🌾", bg: "bg-amber-100" },
                  { label: "Sunflower Oil", price: "From ₹75", emoji: "🌻", bg: "bg-yellow-100" },
                  { label: "Refined Sugar", price: "From ₹30", emoji: "🍚", bg: "bg-blue-100" },
                  { label: "Toor Dal", price: "From ₹75", emoji: "🫘", bg: "bg-orange-100" },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-2xl p-5 text-center shadow-lg backdrop-blur-sm`}>
                    <div className="text-4xl mb-2">{item.emoji}</div>
                    <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                    <div className="text-green-600 font-bold text-sm mt-1">{item.price}</div>
                  </div>
                ))}
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-xl shadow-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-600">500+</div>
                <div className="text-xs text-gray-500">Products Listed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
