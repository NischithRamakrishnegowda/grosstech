import RequestList from "@/components/buyer-requests/RequestList";

export default function AdminBuyerRequestsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Buy Requests</h1>
      <p className="text-sm text-gray-500 mb-6">Buyer purchase requests visible to all authenticated users.</p>
      <RequestList />
    </div>
  );
}
