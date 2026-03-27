import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Placed!</h1>
          <p className="text-gray-500 mt-2 leading-relaxed">
            Your order has been placed successfully. A confirmation email has been sent to you.
          </p>
          {orderId && (
            <div className="mt-4 inline-block bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <p className="text-xs text-gray-400 mb-0.5">Order ID</p>
              <p className="font-mono font-semibold text-gray-800 text-sm">#{orderId.slice(-8).toUpperCase()}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/orders">View My Orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
