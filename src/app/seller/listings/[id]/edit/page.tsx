"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm, { ProductFormData } from "@/components/products/ProductForm";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [listing, setListing] = useState<ProductFormData | null>(null);
  const { data: items = [] } = useSWR("/api/items?all=true", fetcher);

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch(`/api/products/${params.id}`).then((r) => r.json()),
    ]).then(([cats, data]) => {
      if (data?.error) { toast.error("Listing not found"); router.push("/seller/listings"); return; }
      setCategories(cats);
      setListing({
        name: data.name,
        brand: data.brand || "",
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        categoryId: data.categoryId,
        itemId: data.itemId || "",
        priceOptions: data.priceOptions.map((p: { weight: string; price: number; stock: number; mode?: string; minQty?: number }) => ({
          weight: p.weight,
          price: p.price,
          stock: p.stock,
          mode: p.mode || "RETAIL",
          minQty: p.minQty || 1,
        })),
      });
    }).catch(() => {
      toast.error("Failed to load listing");
      router.push("/seller/listings");
    });
  }, [params.id, router]);

  async function handleSubmit(data: ProductFormData) {
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Listing updated!");
        router.push("/seller/listings");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to update listing");
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
      <Link href="/seller/listings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Listings
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Listing</h1>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <ProductForm
          categories={categories}
          items={items}
          defaultValues={listing}
          onSubmit={handleSubmit}
          loading={loading}
          submitLabel="Update Listing"
        />
      </div>
    </div>
  );
}
