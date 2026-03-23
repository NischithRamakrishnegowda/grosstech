"use client";

import { useState } from "react";
import CategoryManager from "@/components/admin/CategoryManager";
import ItemManager from "@/components/admin/ItemManager";

interface Props {
  items: Parameters<typeof ItemManager>[0]["initialItems"];
  categories: Parameters<typeof CategoryManager>[0]["initialCategories"];
}

export default function CatalogTabs({ items, categories }: Props) {
  const [tab, setTab] = useState<"categories" | "items">("categories");

  // ItemManager needs simple category list (id + name)
  const simpleCats = categories.map((c) => ({ id: c.id, name: c.name }));

  return (
    <div>
      {/* Tabs */}
      <div className="flex rounded-xl border border-gray-200 overflow-hidden w-fit mb-6">
        <button
          onClick={() => setTab("categories")}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
            tab === "categories" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Categories
        </button>
        <button
          onClick={() => setTab("items")}
          className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
            tab === "items" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          Items
        </button>
      </div>

      {tab === "categories" ? (
        <CategoryManager initialCategories={categories} />
      ) : (
        <ItemManager initialItems={items} categories={simpleCats} />
      )}
    </div>
  );
}
