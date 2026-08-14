"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Plus, Pencil, Trash2, Loader2, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  _count: { items: number; listings: number };
}

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function resetForm() {
    setName(""); setSlug(""); setImageUrl(null);
    setShowForm(false); setEditingId(null);
  }

  function openCreate() { resetForm(); setShowForm(true); }

  function openEdit(cat: Category) {
    setName(cat.name); setSlug(cat.slug); setImageUrl(cat.imageUrl);
    setEditingId(cat.id); setShowForm(true);
  }

  function autoSlug(value: string) {
    setName(value);
    if (!editingId) setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name, imageUrl };
      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        toast.success("Category updated");
      } else {
        if (!slug.trim()) { toast.error("Slug is required"); setSaving(false); return; }
        const res = await fetch("/api/admin/categories", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, slug }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        toast.success("Category created");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally { setDeletingId(null); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">{editingId ? "Edit Category" : "New Category"}</h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-4">
            <ImageUpload value={imageUrl} onChange={setImageUrl} aspectRatio="square" className="w-20 shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="e.g. Grains" className="h-9" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug {editingId ? "(read-only)" : "*"}</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. grains"
                  disabled={!!editingId} className="h-9 disabled:opacity-50 font-mono text-xs" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact card grid — more columns, smaller cards */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No categories yet. Add one to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow group">
              {/* Image */}
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                {cat.imageUrl ? (
                  <NextImage src={cat.imageUrl} alt={cat.name} fill className="object-cover" sizes="200px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)}
                    className="bg-white/90 backdrop-blur-sm rounded-md p-1 text-gray-600 hover:text-blue-600 shadow-sm transition-colors">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id || cat._count.items > 0}
                    title={cat._count.items > 0 ? "Cannot delete: has items" : "Delete"}
                    className="bg-white/90 backdrop-blur-sm rounded-md p-1 text-gray-600 hover:text-red-600 disabled:opacity-30 shadow-sm transition-colors">
                    {deletingId === cat.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {/* Info */}
              <div className="p-2.5">
                <p className="font-semibold text-gray-900 text-xs truncate">{cat.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{cat._count.items} items</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
