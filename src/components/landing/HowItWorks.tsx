import { UserPlus, Search, CreditCard, Package } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up as a buyer or seller in under a minute.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Search,
    title: "Browse Products",
    description: "Explore hundreds of daily essentials at competitive prices.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Pay safely via Razorpay. Only ₹20 platform fee added.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Package,
    title: "Get Delivered",
    description: "Your order is processed and delivered. Seller paid after 3 days.",
    color: "bg-orange-100 text-orange-600",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-gray-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
          <p className="text-gray-500 mt-2">Get started in 4 simple steps</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="text-center">
              <div className="relative inline-flex">
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto`}>
                  <step.icon className="w-7 h-7" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {index + 1}
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
