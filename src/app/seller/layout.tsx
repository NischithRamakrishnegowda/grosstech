import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SellerSidebar from "@/components/seller/SellerSidebar";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SELLER") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex">
        <SellerSidebar />
        <main className="flex-1 bg-gray-50 p-6 lg:p-8">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
