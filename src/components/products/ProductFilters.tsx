"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
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

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");

  const currentCategory = searchParams.get("category") || "";
  const currentMode = searchParams.get("mode") || "RETAIL";

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (search !== current) {
        updateParams({ search: search || null });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search, searchParams, updateParams]);

  function handlePriceApply() {
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;
    if (min !== null && max !== null && min > max) {
      setMinPrice(maxPrice);
      setMaxPrice(minPrice);
      updateParams({ minPrice: maxPrice, maxPrice: minPrice });
      return;
    }
    updateParams({
      minPrice: min !== null && min >= 0 ? String(min) : null,
      maxPrice: max !== null && max >= 0 ? String(max) : null,
    });
  }

  function handleClearFilters() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
    router.push("/products");
  }

  const hasFilters = search || minPrice || maxPrice || currentCategory || currentMode !== "RETAIL";

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search items... (e.g. Rice, Toor Dal, Oil)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 rounded-xl"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Mode toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {(["RETAIL", "BULK"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateParams({ mode: mode === "RETAIL" ? null : mode })}
              aria-pressed={currentMode === mode}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${
                currentMode === mode
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {mode === "RETAIL" ? "Retail" : "Bulk"}
            </button>
          ))}
        </div>

        {/* Price range */}
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-24 sm:w-28 rounded-xl text-sm"
            aria-label="Minimum price"
          />
          <span className="text-gray-400 text-sm">—</span>
          <Input
            type="number"
            min="0"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-24 sm:w-28 rounded-xl text-sm"
            aria-label="Maximum price"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handlePriceApply}
            className="rounded-xl"
          >
            Apply
          </Button>
        </div>

        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-red-500 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => updateParams({ category: null })}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
            !currentCategory
              ? "bg-green-600 text-white shadow-sm shadow-green-200"
              : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => updateParams({ category: cat.slug })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              currentCategory === cat.slug
                ? "bg-green-600 text-white shadow-sm shadow-green-200"
                : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
            }`}
          >
            {cat.name}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${currentCategory === cat.slug ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
              {cat.itemCount}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
