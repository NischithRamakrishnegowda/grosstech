"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm, { ProductFormData } from "@/components/products/ProductForm";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NewListingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: categories = [] } = useSWR("/api/categories", fetcher);
  const { data: items = [] } = useSWR("/api/items?all=true", fetcher);

  async function handleSubmit(data: ProductFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Listing submitted for approval!");
        router.push("/seller/listings");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create listing");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/seller/listings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProductForm
          categories={categories}
          items={items}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Submit for Approval"
        />
      </div>
    </div>
  );
}
