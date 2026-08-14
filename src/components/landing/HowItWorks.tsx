import { UserPlus, Search, ShieldCheck, Package } from "lucide-react";

const STEPS = [
  { icon: UserPlus,    title: "Create Account",  desc: "Sign up in under a minute as buyer or seller."         },
  { icon: Search,      title: "Browse Products", desc: "Find rice, sugar, oil and more at wholesale prices."    },
  { icon: ShieldCheck, title: "Pay Securely",    desc: "Razorpay escrow — funds held until delivery confirmed." },
  { icon: Package,     title: "Receive Order",   desc: "Seller paid after 3-day buyer protection window."       },
];

export default function HowItWorks() {
  return (
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-lg font-black text-gray-900">How It Works</h2>
          <p className="text-sm text-gray-500 mt-1">Get started in 4 simple steps</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary-600" strokeWidth={1.75} />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-black flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{step.title}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
