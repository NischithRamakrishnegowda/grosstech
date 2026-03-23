"use client";

import { useState, useRef } from "react";
import { Plus, Pencil, Trash2, Loader2, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  _count: { items: number; listings: number };
}

function compressImage(file: File, maxDim = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed")); };
    img.src = url;
  });
}

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setName(""); setSlug("");
    setImagePreview(null); setImageBase64(null);
    setShowForm(false); setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function openCreate() { resetForm(); setShowForm(true); }

  function openEdit(cat: Category) {
    setName(cat.name);
    setSlug(cat.slug);
    setImagePreview(cat.imageUrl);
    setImageBase64(null);
    setEditingId(cat.id);
    setShowForm(true);
  }

  function autoSlug(value: string) {
    setName(value);
    if (!editingId) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
    try {
      const base64 = await compressImage(file);
      setImagePreview(base64);
      setImageBase64(base64);
    } catch {
      toast.error("Failed to process image");
    }
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const payload: Record<string, string | null | undefined> = { name };
      if (imageBase64 !== null) payload.imageUrl = imageBase64 || null;

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
        payload.slug = slug;
        const res = await fetch("/api/admin/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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

      {/* Create/Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{editingId ? "Edit Category" : "New Category"}</h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                className="disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Image</Label>
              <div className="flex items-center gap-2">
                {imagePreview ? (
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageBase64(""); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute -top-1 -right-1 bg-white rounded-full shadow-sm p-0.5"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors shrink-0"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>
                )}
                <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-green-600 hover:underline">
                  {imagePreview ? "Change" : "Upload"}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Image */}
            <div className="aspect-[3/2] bg-gray-100 relative">
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
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
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-1.5 text-gray-600 hover:text-red-600 disabled:opacity-30 shadow-sm transition-colors"
                  title={cat._count.items > 0 ? "Cannot delete: has items" : "Delete"}
                >
                  {deletingId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900">{cat.name}</h3>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
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
