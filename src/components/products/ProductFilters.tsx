"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useTransition } from "react";
import { Search, X, Loader2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

export default function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch]       = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice]   = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice]   = useState(searchParams.get("maxPrice") || "");
  const [showPrice, setShowPrice] = useState(!!(searchParams.get("minPrice") || searchParams.get("maxPrice")));

  const currentCategory = searchParams.get("category") || "";
  const currentMode     = searchParams.get("mode") || "BULK";
  const hasFilters      = search || minPrice || maxPrice || currentCategory || currentMode !== "BULK";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      window.dispatchEvent(new CustomEvent("products-filter-change"));
      startTransition(() => router.push(`/products?${params.toString()}`));
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (search !== current) updateParams({ search: search || null });
    }, 400);
    return () => clearTimeout(timer);
  }, [search, searchParams, updateParams]);

  function handlePriceApply() {
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;
    if (min !== null && max !== null && min > max) {
      setMinPrice(maxPrice); setMaxPrice(minPrice);
      updateParams({ minPrice: maxPrice, maxPrice: minPrice });
      return;
    }
    updateParams({
      minPrice: min !== null && min >= 0 ? String(min) : null,
      maxPrice: max !== null && max >= 0 ? String(max) : null,
    });
  }

  function handleClear() {
    setSearch(""); setMinPrice(""); setMaxPrice(""); setShowPrice(false);
    startTransition(() => router.push("/products"));
  }

  return (
    <div className="space-y-0">

      {/* Row 1 — Search + Price filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Search items… rice, toor dal, oil"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-9 h-11 rounded-xl bg-gray-50 border-gray-200 text-sm"
          />
          {search ? (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          ) : isPending ? (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-spin" />
          ) : null}
        </div>

        <button
          onClick={() => setShowPrice(!showPrice)}
          className={`h-11 px-3.5 rounded-xl border text-sm font-medium flex items-center gap-1.5 transition-all shrink-0 ${
            showPrice ? "border-green-500 text-green-600 bg-green-50" : "border-gray-200 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Price</span>
        </button>
      </div>

      {/* Price range — collapsible */}
      {showPrice && (
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <Input type="number" min="0" placeholder="Min ₹" value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
            className="w-28 h-10 rounded-xl text-sm" />
          <span className="text-gray-300 text-sm">—</span>
          <Input type="number" min="0" placeholder="Max ₹" value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
            className="w-28 h-10 rounded-xl text-sm" />
          <Button size="sm" onClick={handlePriceApply} className="h-10 rounded-xl bg-green-600 hover:bg-green-700">
            Apply
          </Button>
        </div>
      )}

      {/* Row 2 — Mode tabs (underline style) */}
      <div className="flex items-center border-b border-gray-100">
        {(["BULK", "RETAIL"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => updateParams({ mode: mode === "BULK" ? null : mode })}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-all ${
              currentMode === mode
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {mode === "BULK" ? "Bulk" : "Retail"}
          </button>
        ))}

        {hasFilters && (
          <button onClick={handleClear} className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors pb-2.5">
            Clear all
          </button>
        )}
      </div>

      {/* Row 3 — Category text links */}
      <div className="flex gap-5 overflow-x-auto pt-3 pb-1 scrollbar-hide">
        <button
          onClick={() => updateParams({ category: null })}
          className={`text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
            !currentCategory ? "text-green-600" : "text-gray-400 hover:text-gray-700"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParams({ category: cat.slug })}
            className={`text-sm font-semibold whitespace-nowrap shrink-0 transition-colors ${
              currentCategory === cat.slug ? "text-green-600" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            {cat.name}
            <span className={`ml-1 text-xs font-normal ${currentCategory === cat.slug ? "text-green-400" : "text-gray-300"}`}>
              {cat.itemCount}
            </span>
          </button>
        ))}
      </div>

    </div>
  );
}
