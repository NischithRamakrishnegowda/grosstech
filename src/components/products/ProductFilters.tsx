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

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [showPriceFilter, setShowPriceFilter] = useState(!!(searchParams.get("minPrice") || searchParams.get("maxPrice")));

  const currentCategory = searchParams.get("category") || "";
  const currentMode = searchParams.get("mode") || "BULK";

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
      startTransition(() => {
        router.push(`/products?${params.toString()}`);
      });
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
    setShowPriceFilter(false);
    startTransition(() => {
      router.push("/products");
    });
  }

  const hasFilters = search || minPrice || maxPrice || currentCategory || currentMode !== "BULK";

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search items... (e.g. Rice, Toor Dal, Oil)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 pr-10 h-11 rounded-xl text-base sm:text-sm"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        ) : isPending ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500 animate-spin" />
        ) : null}
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Mode toggle */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {(["BULK", "RETAIL"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateParams({ mode: mode === "BULK" ? null : mode })}
              aria-pressed={currentMode === mode}
              className={`px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                currentMode === mode
                  ? "bg-green-600 text-white shadow-inner"
                  : "bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              {mode === "RETAIL" ? "Retail" : "Bulk"}
            </button>
          ))}
        </div>

        {/* Price filter toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPriceFilter(!showPriceFilter)}
          className={`rounded-xl h-[42px] ${showPriceFilter ? "border-green-300 text-green-600" : ""}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Price
        </Button>

        {/* Clear all */}
        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors ml-1"
          >
            Clear all
          </button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <div className="flex items-center gap-1.5 text-sm text-green-600 ml-auto">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Loading...</span>
          </div>
        )}
      </div>

      {/* Price range — collapsible */}
      {showPriceFilter && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Input
            type="number"
            min="0"
            placeholder="Min ₹"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
            className="w-28 rounded-xl text-sm h-10"
            aria-label="Minimum price"
          />
          <span className="text-gray-300">—</span>
          <Input
            type="number"
            min="0"
            placeholder="Max ₹"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
            className="w-28 rounded-xl text-sm h-10"
            aria-label="Maximum price"
          />
          <Button
            size="sm"
            onClick={handlePriceApply}
            className="rounded-xl h-10 bg-green-600 hover:bg-green-700"
          >
            Go
          </Button>
        </div>
      )}

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => updateParams({ category: null })}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
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
