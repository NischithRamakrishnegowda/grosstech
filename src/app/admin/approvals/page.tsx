import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ApprovalManager from "@/components/admin/ApprovalManager";

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login?error=unauthorized");

  const listings = await prisma.listing.findMany({
    where: { status: "PENDING_APPROVAL" },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: {
        select: { id: true, name: true, email: true, businessName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Approvals</h1>
      <ApprovalManager listings={JSON.parse(JSON.stringify(listings))} />
    </div>
  );
}
