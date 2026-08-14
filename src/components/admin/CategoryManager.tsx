"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { items: number; listings: number };
}

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  function resetForm() {
    setName(""); setSlug("");
    setShowModal(false); setEditingId(null);
  }

  function openCreate() { resetForm(); setShowModal(true); }

  function openEdit(cat: Category) {
    setName(cat.name); setSlug(cat.slug);
    setEditingId(cat.id); setShowModal(true);
  }

  function autoSlug(value: string) {
    setName(value);
    if (!editingId) setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/categories/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || "Failed"); }
        const updated = await res.json();
        setCategories((prev) => prev.map((c) => (c.id === editingId ? updated : c)));
        toast.success("Category updated");
      } else {
        if (!slug.trim()) { toast.error("Slug is required"); setSaving(false); return; }
        const res = await fetch("/api/admin/categories", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug }),
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500">{categories.length} categories</p>
        </div>
        <Button onClick={openCreate} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={resetForm}
        title={editingId ? "Edit Category" : "New Category"}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Name *</Label>
            <Input value={name} onChange={(e) => autoSlug(e.target.value)} placeholder="e.g. Grains" className="h-9" autoFocus />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Slug {editingId ? "(read-only)" : "*"}</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. grains"
              disabled={!!editingId}
              className="h-9 disabled:opacity-50 font-mono text-xs"
            />
            {!editingId && <p className="text-xs text-gray-400">Auto-generated from name. Used in URL.</p>}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={resetForm}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No categories yet. Add one to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-400">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 hidden sm:table-cell">Slug</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-center">Items</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{cat.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {cat._count.items}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cat)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(cat.id)}
                        disabled={deletingId === cat.id || cat._count.items > 0}
                        title={cat._count.items > 0 ? "Has items — delete items first" : "Delete"}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        {deletingId === cat.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
