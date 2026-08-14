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
    setName("");
    setSlug("");
    setImageUrl(null);
    setShowForm(false);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(cat: Category) {
    setName(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.imageUrl);
    setEditingId(cat.id);
    setShowForm(true);
  }

  function autoSlug(value: string) {
    setName(value);
    if (!editingId) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { name, imageUrl };

      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        toast.success("Category updated");
      } else {
        if (!slug.trim()) { toast.error("Slug is required"); setSaving(false); return; }
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    } finally {
      setSaving(false);
    }
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
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add Category
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{editingId ? "Edit Category" : "New Category"}</h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <ImageUpload
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio="3/2"
              className="w-full sm:w-40 shrink-0"
            />
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="e.g. Grains" />
              </div>
              <div className="space-y-1.5">
                <Label>Slug {editingId ? "(read-only)" : "*"}</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. grains"
                  disabled={!!editingId}
                  className="disabled:opacity-50 font-mono text-sm"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="aspect-[3/2] bg-gray-100 relative overflow-hidden">
              {cat.imageUrl ? (
                <NextImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200">
                  <ImagePlus className="w-10 h-10" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => openEdit(cat)}
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 text-gray-600 hover:text-blue-600 shadow-sm transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id || cat._count.items > 0}
                  title={cat._count.items > 0 ? "Cannot delete: has items" : "Delete"}
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 text-gray-600 hover:text-red-600 disabled:opacity-30 shadow-sm transition-colors"
                >
                  {deletingId === cat.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900">{cat.name}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{cat._count.items} item{cat._count.items !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{cat._count.listings} listing{cat._count.listings !== 1 ? "s" : ""}</span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-1">{cat.slug}</p>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No categories yet</p>
          <p className="text-sm mt-1">Create categories to organize your items.</p>
        </div>
      )}
    </div>
  );
}
