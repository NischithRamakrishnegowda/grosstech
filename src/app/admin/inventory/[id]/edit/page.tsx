"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductForm, { ProductFormData } from "@/components/products/ProductForm";
import { toast } from "sonner";

export default function AdminEditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [listing, setListing] = useState<ProductFormData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/products/${params.id}`).then((r) => r.json()),
    ]).then(([cats, data]) => {
      if (data?.error) { toast.error("Product not found"); router.push("/admin/inventory"); return; }
      setCategories(cats);
      setListing({
        name: data.name,
        brand: data.brand || "",
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        categoryId: data.categoryId,
        priceOptions: data.priceOptions.map((p: { weight: string; price: number; stock: number }) => ({
          weight: p.weight,
          price: p.price,
          stock: p.stock,
        })),
      });
    }).catch(() => {
      toast.error("Failed to load product");
      router.push("/admin/inventory");
    });
  }, [params.id, router]);

  async function handleSubmit(data: ProductFormData) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Product updated!");
        router.push("/admin/inventory");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!listing) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Link href="/admin/inventory" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Inventory
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProductForm
          categories={categories}
          defaultValues={listing}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Update Product"
        />
      </div>
    </div>
  );
}
