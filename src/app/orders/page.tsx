import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Truck, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { PLATFORM_FEE } from "@/lib/constants";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAYMENT_HELD: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RELEASED_TO_SELLER: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Processing",
  PAYMENT_HELD: "Order Placed",
  FAILED: "Failed",
  RELEASED_TO_SELLER: "Delivered",
  CANCELLED: "Cancelled",
};

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    include: {
      items: {
        include: {
          listing: { select: { name: true, brand: true, seller: { select: { name: true, businessName: true } } } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group split orders (same checkout) by checkoutId, falling back to razorpayOrderId or order.id
  const groupMap = new Map<string, typeof orders>();
  for (const order of orders) {
    const key = order.checkoutId ?? order.razorpayOrderId ?? order.id;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(order);
  }
  const paymentGroups = Array.from(groupMap.values());

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

          {paymentGroups.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No orders yet</p>
              <p className="text-gray-400 text-sm mt-1">Start shopping to see your orders here</p>
              <Link href="/products" className="mt-5 inline-block bg-green-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 transition-colors text-sm">
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentGroups.map((group) => {
                const primary = group[0];
                const isMultiSeller = group.length > 1;
                // For split orders (platformFee=0 on each), add fee once
                const isSplit = group.every((o) => o.platformFee === 0);
                const itemsTotal = group.reduce((s, o) => s + o.total, 0);
                const platformFeeDisplay = isSplit ? PLATFORM_FEE : primary.platformFee;
                const totalPaid = itemsTotal + (isSplit ? PLATFORM_FEE : 0);

                return (
                  <div key={primary.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Order #{primary.checkoutId ?? primary.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(primary.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[primary.status] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_LABELS[primary.status] || primary.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Items — grouped by seller if multi-seller */}
                    <div className="space-y-3 mb-3">
                      {isMultiSeller ? (
                        group.map((sellerOrder) => {
                          const sellerName = sellerOrder.items[0]?.listing?.seller?.businessName
                            || sellerOrder.items[0]?.listing?.seller?.name
                            || "Seller";
                          return (
                            <div key={sellerOrder.id} className="bg-gray-50 rounded-xl p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-2">{sellerName}</p>
                              <div className="space-y-1.5">
                                {sellerOrder.items.map((item) => (
                                  <div key={item.id} className="flex justify-between text-sm">
                                    <span className="text-gray-600">
                                      {item.listing.name} ({item.priceOption.weight}) × {item.quantity}
                                    </span>
                                    <span className="text-gray-700 font-medium">₹{item.priceAtOrder * item.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        primary.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">
                              {item.listing.name} ({item.priceOption.weight}) × {item.quantity}
                            </span>
                            <span className="text-gray-700 font-medium">₹{item.priceAtOrder * item.quantity}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                        <div className="text-gray-500 text-xs">
                          Items ₹{itemsTotal} + Fee ₹{platformFeeDisplay}
                        </div>
                        <div className="font-bold text-green-600">Total: ₹{totalPaid}</div>
                      </div>
                      {primary.deliveryOption === "DELIVERY" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                          <Truck className="w-3 h-3" /> Delivery
                          {primary.deliveryCharge != null
                            ? ` · ₹${primary.deliveryCharge} (paid separately)`
                            : " · Charge to be communicated"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                          <Package className="w-3 h-3" /> Self Pickup
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
