import { UserPlus, Search, CreditCard, Package } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "Create Account",
    description: "Sign up as a buyer or seller in under a minute. No paperwork, no hassle.",
  },
  {
    icon: Search,
    number: "02",
    title: "Browse Products",
    description: "Explore daily essentials — rice, oil, dal and more at wholesale prices.",
  },
  {
    icon: CreditCard,
    number: "03",
    title: "Secure Payment",
    description: "Pay safely via Razorpay. Funds are held in escrow for your protection.",
  },
  {
    icon: Package,
    number: "04",
    title: "Get Delivered",
    description: "Order delivered. Seller receives payment after 3-day protection window.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 animate-fade-up">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-1">Process</p>
          <h2 className="text-3xl font-black text-slate-900">How It Works</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:border-green-200 hover:bg-green-50/30 transition-all duration-200 animate-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Step number */}
              <div className="text-5xl font-black text-slate-300 leading-none mb-4 group-hover:text-green-300 transition-colors">
                {step.number}
              </div>

              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm group-hover:border-green-200 transition-colors">
                <step.icon className="w-5 h-5 text-slate-600 group-hover:text-green-600 transition-colors" />
              </div>

              <h3 className="font-bold text-slate-900 mb-1.5">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
