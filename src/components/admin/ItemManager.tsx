"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

interface Item {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: Category;
  _count: { listings: number };
}

interface Props {
  initialItems: Item[];
  categories: Category[];
}

export default function ItemManager({ initialItems, categories }: Props) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function resetForm() {
    setName(""); setSlug(""); setCategoryId("");
    setImageUrl(null);
    setShowForm(false); setEditingId(null);
  }

  function openCreate() { resetForm(); setShowForm(true); }

  function openEdit(item: Item) {
    setName(item.name);
    setSlug(item.slug);
    setCategoryId(item.category.id);
    setImageUrl(item.imageUrl);
    setEditingId(item.id);
    setShowForm(true);
  }

  function autoSlug(value: string) {
    setName(value);
    if (!editingId) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }

  async function handleSave() {
    if (!name.trim() || !categoryId) {
      toast.error("Name and category are required"); return;
    }
    setSaving(true);
    try {
      const payload: Record<string, string | null | undefined> = { name, categoryId, imageUrl };

      if (editingId) {
        const res = await fetch(`/api/admin/items/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === editingId ? { ...i, ...updated } : i)));
        toast.success("Item updated");
      } else {
        if (!slug.trim()) { toast.error("Slug is required"); setSaving(false); return; }
        payload.slug = slug;
        const res = await fetch("/api/admin/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        const created = await res.json();
        setItems((prev) => [...prev, { ...created, _count: { listings: 0 } }]);
        toast.success("Item created");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  // Group items by category
  const grouped = items.reduce<Record<string, Item[]>>((acc, item) => {
    const catName = item.category.name;
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(item);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Predefined Items</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} items across {Object.keys(grouped).length} categories</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Modal */}
      <Modal
        open={showForm}
        onClose={resetForm}
        title={editingId ? "Edit Item" : "New Item"}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <ImageUpload value={imageUrl} onChange={setImageUrl} className="w-20 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="e.g. Basmati Rice" className="h-9" autoFocus />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug {editingId ? "(read-only)" : "*"}</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. basmati-rice"
                  disabled={!!editingId}
                  className="h-9 disabled:opacity-50 font-mono text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category *</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Items grouped by category */}
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([catName, catItems]) => (
        <div key={catName} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{catName}</h3>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-2">
            {catItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                  {item.imageUrl ? (
                    <NextImage src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-400">{item._count.listings} listing{item._count.listings !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id || item._count.listings > 0}
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-30"
                  >
                    {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 text-left text-gray-500">
                  <th className="px-4 py-3 font-medium w-12">Image</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium text-center">Listings</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
                        {item.imageUrl ? (
                          <NextImage src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{item.slug}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                        {item._count.listings}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(item)} className="text-gray-400 hover:text-blue-500 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id || item._count.listings > 0}
                          className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                          title={item._count.listings > 0 ? "Cannot delete: has listings" : "Delete item"}
                        >
                          {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <EmptyState icon={Package} title="No items yet" description="Add predefined items that sellers can list under." />
      )}
    </div>
  );
}
