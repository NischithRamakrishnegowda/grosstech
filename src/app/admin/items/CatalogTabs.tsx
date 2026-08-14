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
      <div className="flex bg-gray-100 rounded-lg p-0.5 w-fit mb-6">
        {(["categories", "items"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-md text-sm font-semibold transition-all duration-150 capitalize ${
              tab === t ? "bg-green-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <CategoryManager initialCategories={categories} />
      ) : (
        <ItemManager initialItems={items} categories={simpleCats} />
      )}
    </div>
  );
}
