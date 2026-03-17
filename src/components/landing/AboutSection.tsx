import Link from "next/link";
import { ShieldCheck, Users, TrendingUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: ShieldCheck,
    title: "Secure & Transparent",
    description: "Every transaction is protected. Funds held for 3 days post-delivery before reaching sellers.",
  },
  {
    icon: Users,
    title: "Community First",
    description: "We connect local sellers with buyers, supporting small businesses across India.",
  },
  {
    icon: TrendingUp,
    title: "Best Prices",
    description: "Direct seller-to-buyer model means lower prices. Only ₹20 flat platform fee.",
  },
  {
    icon: Heart,
    title: "Quality Assured",
    description: "All sellers are verified. Products are exactly as described or money back.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full mb-4">
              About Us
            </div>
            <h2 className="text-3xl font-bold text-gray-900 leading-tight">
              India&apos;s Trusted Marketplace for Daily Essentials
            </h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Gross Tech was built to simplify how Indians buy daily essentials like rice, sugar,
              and oil. We eliminate middlemen, connect buyers directly with verified local sellers,
              and ensure every transaction is safe and transparent.
            </p>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Whether you&apos;re stocking up your kitchen or running a small kirana store,
              Gross Tech gives you access to the best prices with the security of our escrow payment system.
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="bg-green-600 hover:bg-green-700" asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup?role=SELLER">Become a Seller</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {values.map((val) => (
              <div key={val.title} className="bg-gray-50 rounded-2xl p-5">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <val.icon className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{val.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
