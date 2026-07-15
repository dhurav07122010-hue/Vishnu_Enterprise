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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, Tag, ImagePlus, X, Layers } from "lucide-react";

export const Route = createFileRoute("/admin/subcategories")({
  component: AdminSubcategories,
});

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function uploadSubcategoryImage(file: File): Promise<string> {
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
  parent_id: "",
  name: "",
  slug: "",
  description: "",
  sort_order: "0",
  is_visible: true,
};
type SubForm = typeof defaultForm;

function AdminSubcategories() {
  const ready = useRequireAdmin();
  const [mainCategories, setMainCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterMain, setFilterMain] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSub, setEditSub] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteBlocked, setDeleteBlocked] = useState(false);

  const [form, setForm] = useState<SubForm>(defaultForm);
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
    setMainCategories(all.filter((c: any) => !c.parent_id));
    setSubcategories(all.filter((c: any) => !!c.parent_id));

    // product counts per subcategory
    const counts: Record<string, number> = {};
    (prods ?? []).forEach((p: any) => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
    });
    setProductCounts(counts);
    setLoading(false);
  }

  function resetDialog() {
    setForm(defaultForm);
    setSlugManual(false);
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl("");
  }

  function openAdd(parentId?: string) {
    setEditSub(null);
    resetDialog();
    if (parentId) setForm((f) => ({ ...f, parent_id: parentId }));
    setDialogOpen(true);
  }

  function openEdit(s: any) {
    setEditSub(s);
    setSlugManual(true);
    setForm({
      parent_id: s.parent_id ?? "",
      name: s.name ?? "",
      slug: s.slug ?? "",
      description: s.description ?? "",
      sort_order: String(s.sort_order ?? 0),
      is_visible: s.is_visible !== false,
    });
    setExistingImageUrl(s.image_url ?? "");
    setImageFile(null);
    setLocalPreview("");
    setDialogOpen(true);
  }

  function setField(k: keyof SubForm, v: any) {
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
    if (!form.parent_id) { toast.error("Select a main category"); return; }
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    setSaving(true);

    let imageUrl = existingImageUrl || null;
    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadSubcategoryImage(imageFile);
      } catch (err: any) {
        toast.error(`Image upload failed: ${err.message}`);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload: Record<string, any> = {
      parent_id: form.parent_id,
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_visible: form.is_visible,
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editSub) {
        const { error } = await supabase.from("categories").update(payload).eq("id", editSub.id);
        if (error) throw error;
        setSubcategories((prev) => prev.map((s) => s.id === editSub.id ? { ...s, ...payload } : s));
        toast.success("Subcategory updated");
      } else {
        const { data, error } = await supabase.from("categories").insert(payload).select().single();
        if (error) throw error;
        setSubcategories((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
        toast.success("Subcategory created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(sub: any) {
    const count = productCounts[sub.id] ?? 0;
    setDeleteBlocked(count > 0);
    setDeleteTarget(sub);
  }

  async function confirmDelete() {
    if (!deleteTarget || deleteBlocked) return;
    const { error } = await supabase.from("categories").delete().eq("id", deleteTarget.id);
    if (!error) {
      setSubcategories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Subcategory deleted");
    } else toast.error(error.message);
    setDeleteTarget(null);
  }

  async function moveSub(id: string, dir: "up" | "down") {
    const sub = subcategories.find((s) => s.id === id);
    if (!sub) return;
    // Only move within the same parent
    const siblings = subcategories.filter((s) => s.parent_id === sub.parent_id);
    const idx = siblings.findIndex((s) => s.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const aOrder = siblings[idx].sort_order;
    const bOrder = siblings[swapIdx].sort_order;
    const newA = bOrder !== aOrder ? bOrder : dir === "up" ? aOrder - 1 : aOrder + 1;
    const newB = aOrder;

    await Promise.all([
      supabase.from("categories").update({ sort_order: newA }).eq("id", siblings[idx].id),
      supabase.from("categories").update({ sort_order: newB }).eq("id", siblings[swapIdx].id),
    ]);

    setSubcategories((prev) =>
      prev.map((s) => {
        if (s.id === siblings[idx].id) return { ...s, sort_order: newA };
        if (s.id === siblings[swapIdx].id) return { ...s, sort_order: newB };
        return s;
      }).sort((a, b) => a.sort_order - b.sort_order)
    );
  }

  async function toggleVisible(s: any) {
    const next = !s.is_visible;
    const { error } = await supabase.from("categories").update({ is_visible: next }).eq("id", s.id);
    if (!error) setSubcategories((prev) => prev.map((x) => x.id === s.id ? { ...x, is_visible: next } : x));
  }

  if (!ready) return null;

  const visibleSubs = filterMain === "all"
    ? subcategories
    : subcategories.filter((s) => s.parent_id === filterMain);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Subcategories</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {subcategories.length} subcategories across {mainCategories.length} main {mainCategories.length === 1 ? "category" : "categories"}
          </p>
        </div>
        <Button onClick={() => openAdd()} className="shadow-elegant" disabled={mainCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" /> Add Subcategory
        </Button>
      </div>

      {mainCategories.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>No main categories yet.</strong> Create at least one Main Category before adding subcategories.
        </div>
      )}

      {/* Filter by main category */}
      {mainCategories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterMain("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${filterMain === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-accent"}`}
          >
            All ({subcategories.length})
          </button>
          {mainCategories.map((m) => {
            const count = subcategories.filter((s) => s.parent_id === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => setFilterMain(m.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${filterMain === m.id ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground hover:bg-accent"}`}
              >
                {m.name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
          Loading subcategories…
        </div>
      ) : visibleSubs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
          <Tag className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No subcategories yet</p>
          {mainCategories.length > 0 && (
            <Button onClick={() => openAdd(filterMain !== "all" ? filterMain : undefined)} variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add subcategory
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Subcategory</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Main Category</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Products</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Visible</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {visibleSubs.map((sub) => {
                const parent = mainCategories.find((m) => m.id === sub.parent_id);
                const siblings = subcategories.filter((s) => s.parent_id === sub.parent_id);
                const sibIdx = siblings.findIndex((s) => s.id === sub.id);
                return (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-lg overflow-hidden bg-primary/10">
                          {sub.image_url ? (
                            <img src={sub.image_url} alt={sub.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Tag className="h-3.5 w-3.5 text-primary" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{sub.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{sub.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {parent ? (
                        <Badge variant="outline" className="gap-1">
                          <Layers className="h-3 w-3" />
                          {parent.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary">{productCounts[sub.id] ?? 0}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveSub(sub.id, "up")}
                          disabled={sibIdx === 0}
                          className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => moveSub(sub.id, "down")}
                          disabled={sibIdx === siblings.length - 1}
                          className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={sub.is_visible !== false} onCheckedChange={() => toggleVisible(sub)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(sub)} className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleDelete(sub)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetDialog(); setDialogOpen(o); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editSub ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Parent category */}
            <div className="space-y-1.5">
              <Label>Main Category <span className="text-destructive">*</span></Label>
              <Select value={form.parent_id} onValueChange={(v) => setField("parent_id", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select main category…" />
                </SelectTrigger>
                <SelectContent>
                  {mainCategories.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Image upload */}
            <div className="space-y-1.5">
              <Label>Image <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {previewSrc ? (
                <div className="relative group rounded-xl overflow-hidden border bg-muted">
                  <img src={previewSrc} alt="Preview" className="w-full h-32 object-cover" />
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
                  className="w-full h-24 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Upload image</span>
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
                placeholder="e.g. Mirror Visors"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>URL Slug <span className="text-xs text-muted-foreground font-normal">(auto-generated)</span></Label>
              <Input
                value={form.slug}
                onChange={(e) => { setSlugManual(true); setField("slug", e.target.value); }}
                placeholder="e.g. mirror-visors"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Short description"
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
                <span className="text-sm font-medium">Visible</span>
                <Switch checked={form.is_visible} onCheckedChange={(v) => setField("is_visible", v)} />
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-28">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{uploading ? "Uploading…" : "Saving…"}</> : editSub ? "Save Changes" : "Create Subcategory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete subcategory?</DialogTitle></DialogHeader>
          {deleteBlocked ? (
            <p className="text-sm text-muted-foreground">
              <strong>{deleteTarget?.name}</strong> has {productCounts[deleteTarget?.id] ?? 0} products assigned to it.
              Reassign or delete those products first.
            </p>
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
