import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, Layers, ImagePlus, X } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({
  component: AdminMainCategories,
});

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `categories/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw new Error(error.message ?? "Image upload failed");
  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(data.path);
  return urlData.publicUrl;
}

const defaultForm = {
  name: "",
  slug: "",
  description: "",
  sort_order: "0",
  is_visible: true,
};
type CatForm = typeof defaultForm;

function AdminMainCategories() {
  const ready = useRequireAdmin();
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<string, number>>({});
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);
  const [deleteBlockedReason, setDeleteBlockedReason] = useState("");

  const [form, setForm] = useState<CatForm>(defaultForm);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (ready) loadAll(); }, [ready]);

  async function loadAll() {
    setLoading(true);
    const [{ data: allCats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("products").select("category_id"),
    ]);
    const all = allCats ?? [];
    const main = all.filter((c: any) => !c.parent_id);
    const subs = all.filter((c: any) => !!c.parent_id);

    setCategories(main);

    // subcategory counts per main
    const subCounts: Record<string, number> = {};
    subs.forEach((s: any) => {
      if (s.parent_id) subCounts[s.parent_id] = (subCounts[s.parent_id] ?? 0) + 1;
    });
    setSubcategoryCounts(subCounts);

    // product counts per main (via subcategories)
    const subIdToMain: Record<string, string> = {};
    subs.forEach((s: any) => { if (s.parent_id) subIdToMain[s.id] = s.parent_id; });
    const pCounts: Record<string, number> = {};
    (prods ?? []).forEach((p: any) => {
      const mainId = subIdToMain[p.category_id];
      if (mainId) pCounts[mainId] = (pCounts[mainId] ?? 0) + 1;
    });
    setProductCounts(pCounts);
    setLoading(false);
  }

  function resetDialog() {
    setForm(defaultForm);
    setSlugManual(false);
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl("");
  }

  function openAdd() {
    setEditCat(null);
    resetDialog();
    setDialogOpen(true);
  }

  function openEdit(c: any) {
    setEditCat(c);
    setSlugManual(true);
    setForm({
      name: c.name ?? "",
      slug: c.slug ?? "",
      description: c.description ?? "",
      sort_order: String(c.sort_order ?? 0),
      is_visible: c.is_visible !== false,
    });
    setExistingImageUrl(c.image_url ?? "");
    setImageFile(null);
    setLocalPreview("");
    setDialogOpen(true);
  }

  function setField(k: keyof CatForm, v: any) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "name" && !slugManual) next.slug = slugify(v);
      return next;
    });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const previewSrc = localPreview || existingImageUrl;

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Category name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);

    let imageUrl = existingImageUrl || null;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadCategoryImage(imageFile);
      } catch (err: any) {
        toast.error(`Image upload failed: ${err.message}`);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload: Record<string, any> = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_visible: form.is_visible,
      image_url: imageUrl,
      parent_id: null, // always null for main categories
      updated_at: new Date().toISOString(),
    };

    try {
      if (editCat) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editCat.id);
        if (error) throw error;
        setCategories((prev) => prev.map((c) => c.id === editCat.id ? { ...c, ...payload } : c));
        toast.success("Category updated");
      } else {
        const { data, error } = await supabase.from("categories").insert(payload).select().single();
        if (error) throw error;
        setCategories((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
        toast.success("Main category created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: any) {
    const subCount = subcategoryCounts[cat.id] ?? 0;
    const prodCount = productCounts[cat.id] ?? 0;
    if (subCount > 0) {
      setDeleteBlocked(true);
      setDeleteBlockedReason(`"${cat.name}" has ${subCount} subcategory(ies) with ${prodCount} product(s). Delete or reassign them first.`);
    } else {
      setDeleteBlocked(false);
      setDeleteBlockedReason("");
    }
    setDeleteTarget(cat);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteBlocked) return;
    const { error } = await supabase.from("categories").delete().eq("id", deleteTarget.id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      toast.success("Category deleted");
    } else toast.error(error.message);
    setDeleteTarget(null);
  }

  async function moveCategory(id: string, dir: "up" | "down") {
    const idx = categories.findIndex((c) => c.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const updated = [...categories];
    const aOrder = updated[idx].sort_order;
    const bOrder = updated[swapIdx].sort_order;
    const newA = bOrder !== aOrder ? bOrder : dir === "up" ? aOrder - 1 : aOrder + 1;
    const newB = aOrder;
    await Promise.all([
      supabase.from("categories").update({ sort_order: newA }).eq("id", updated[idx].id),
      supabase.from("categories").update({ sort_order: newB }).eq("id", updated[swapIdx].id),
    ]);
    updated[idx] = { ...updated[idx], sort_order: newA };
    updated[swapIdx] = { ...updated[swapIdx], sort_order: newB };
    setCategories(updated.sort((a, b) => a.sort_order - b.sort_order));
  }

  async function toggleVisible(c: any) {
    const next = !c.is_visible;
    const { error } = await supabase.from("categories").update({ is_visible: next }).eq("id", c.id);
    if (!error) setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, is_visible: next } : x));
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Main Categories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {categories.length} main {categories.length === 1 ? "category" : "categories"} · shown on the store landing page
          </p>
        </div>
        <Button onClick={openAdd} className="shadow-elegant">
          <Plus className="mr-2 h-4 w-4" /> Add Main Category
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
          Loading categories…
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
          <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No main categories yet</p>
          <p className="text-sm text-muted-foreground mt-1">Main categories appear as large image cards on the Store page</p>
          <Button onClick={openAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add first category
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden sm:table-cell">Subcategories</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground hidden md:table-cell">Products</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Visible</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-primary/10">
                        {cat.image_url ? (
                          <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Layers className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        {cat.description && <p className="text-xs text-muted-foreground line-clamp-1">{cat.description}</p>}
                        <p className="text-xs font-mono text-muted-foreground">{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <Badge variant="outline">{subcategoryCounts[cat.id] ?? 0}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <Badge variant="secondary">{productCounts[cat.id] ?? 0}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => moveCategory(cat.id, "up")}
                        disabled={idx === 0}
                        className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveCategory(cat.id, "down")}
                        disabled={idx === categories.length - 1}
                        className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch checked={cat.is_visible !== false} onCheckedChange={() => toggleVisible(cat)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(cat)} className="h-8 w-8">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => handleDelete(cat)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetDialog(); setDialogOpen(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editCat ? "Edit Main Category" : "Add Main Category"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>Category Image <span className="text-xs text-muted-foreground font-normal">(shown on store page)</span></Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {previewSrc ? (
                <div className="relative group rounded-xl overflow-hidden border bg-muted">
                  <img src={previewSrc} alt="Preview" className="w-full h-40 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                      Change
                    </Button>
                    <Button size="sm" variant="destructive" type="button" onClick={removeImage}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                </button>
              )}
              {uploading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                  Uploading…
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="e.g. Visors"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>URL Slug <span className="text-xs text-muted-foreground font-normal">(auto-generated)</span></Label>
              <Input
                value={form.slug}
                onChange={(e) => { setSlugManual(true); setField("slug", e.target.value); }}
                placeholder="e.g. visors"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Shown on the store page card"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", e.target.value)}
                />
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-muted/40">
                <span className="text-sm font-medium">Visible in store</span>
                <Switch checked={form.is_visible} onCheckedChange={(v) => setField("is_visible", v)} />
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-28">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{uploading ? "Uploading…" : "Saving…"}</> : editCat ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete main category?</DialogTitle></DialogHeader>
          {deleteBlocked ? (
            <p className="text-sm text-muted-foreground">{deleteBlockedReason}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              "<strong>{deleteTarget?.name}</strong>" will be permanently removed. This cannot be undone.
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {deleteBlocked ? "Close" : "Cancel"}
            </Button>
            {!deleteBlocked && (
              <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
