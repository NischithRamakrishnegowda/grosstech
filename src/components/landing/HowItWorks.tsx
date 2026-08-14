import { UserPlus, Search, CreditCard, Package } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Account",
    description: "Sign up as a buyer or seller in under a minute.",
    color: "bg-blue-50 text-blue-600 border-blue-100",
  },
  {
    icon: Search,
    number: "02",
    title: "Browse Products",
    description: "Explore wholesale essentials at the best market prices.",
    color: "bg-purple-50 text-purple-600 border-purple-100",
  },
  {
    icon: CreditCard,
    number: "03",
    title: "Pay Securely",
    description: "Razorpay escrow holds your funds until delivery is confirmed.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
  },
  {
    icon: Package,
    number: "04",
    title: "Receive & Done",
    description: "Get your order. Seller receives payment after 3-day window.",
    color: "bg-green-50 text-green-600 border-green-100",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-2">Process</p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-2 text-sm">Simple steps to get started</p>
        </div>

        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-10 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-px bg-gray-200 z-0" />

          {STEPS.map((step, i) => (
            <div key={step.title} className="relative z-10 flex flex-col items-center text-center">
              {/* Number circle */}
              <div className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center mb-4 bg-white shadow-sm ${step.color}`}>
                <step.icon className="w-7 h-7" />
                <span className="text-[10px] font-bold mt-1 opacity-60">{step.number}</span>
              </div>

              <h3 className="font-bold text-gray-900 mb-1.5">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-[180px]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
