"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm, { ProductFormData } from "@/components/products/ProductForm";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminNewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { data: categories = [] } = useSWR("/api/categories", fetcher);

  async function handleSubmit(data: ProductFormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Product added to inventory!");
        router.push("/admin/inventory");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add product");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Inventory
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product to Inventory</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProductForm
          categories={categories}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Add to Inventory"
        />
      </div>
    </div>
  );
}
