import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import RequestList from "@/components/buyer-requests/RequestList";

export default async function BuyerRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login?callbackUrl=/buyer-requests");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Buy Requests</h1>
            <p className="text-sm text-gray-500 mt-1">
              Buyers post what they need — sellers can browse and reach out.
            </p>
          </div>
          <RequestList />
        </div>
      </main>
      <Footer />
    </div>
  );
}
