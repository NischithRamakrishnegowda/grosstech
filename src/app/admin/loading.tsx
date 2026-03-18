import { Loader2 } from "lucide-react";

export default function AdminLoading() {
  return (
    <div className="flex-1 bg-gray-50 p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );
}
