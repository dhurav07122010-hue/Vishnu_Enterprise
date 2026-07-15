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
import { Plus, Pencil, Trash2, ImagePlus, ChevronUp, ChevronDown, Loader2, Images } from "lucide-react";

export const Route = createFileRoute("/admin/slider")({
  component: AdminSlider,
});

// ── upload (reuses the product-images bucket) ─────────────────────────────────

async function uploadBannerImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `sliders/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw new Error(error.message ?? "Image upload failed");
  return supabase.storage.from("product-images").getPublicUrl(data.path).data.publicUrl;
}

// ── default form ──────────────────────────────────────────────────────────────

const defaultForm = {
  title: "",
  subtitle: "",
  description: "",
  button_text: "",
  button_link: "",
  sort_order: "0",
  is_active: true,
};
type SlideForm = typeof defaultForm;

// ── component ─────────────────────────────────────────────────────────────────

function AdminSlider() {
  const ready = useRequireAdmin();
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editSlide, setEditSlide] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const [form, setForm] = useState<SlideForm>(defaultForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (ready) loadSlides(); }, [ready]);

  async function loadSlides() {
    setLoading(true);
    const { data } = await supabase
      .from("slider_items")
      .select("*")
      .order("sort_order", { ascending: true });
    setSlides(data ?? []);
    setLoading(false);
  }

  function resetDialog() {
    setForm(defaultForm);
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl("");
  }

  function openAdd() {
    setEditSlide(null);
    resetDialog();
    setDialogOpen(true);
  }

  function openEdit(s: any) {
    setEditSlide(s);
    setForm({
      title: s.title ?? "",
      subtitle: s.subtitle ?? "",
      description: s.description ?? "",
      button_text: s.button_text ?? "",
      button_link: s.button_link ?? "",
      sort_order: String(s.sort_order ?? 0),
      is_active: s.is_active !== false,
    });
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl(s.image_url ?? "");
    setDialogOpen(true);
  }

  function setField(k: keyof SlideForm, v: any) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setLocalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  const previewSrc = localPreview || existingImageUrl;

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!editSlide && !imageFile && !existingImageUrl) { toast.error("Banner image is required"); return; }

    setSaving(true);
    let imageUrl = existingImageUrl || "";

    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadBannerImage(imageFile);
      } catch (err: any) {
        toast.error(`Upload failed: ${err.message}`);
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const payload: Record<string, any> = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      description: form.description.trim() || null,
      image_url: imageUrl,
      button_text: form.button_text.trim() || null,
      button_link: form.button_link.trim() || null,
      sort_order: parseInt(form.sort_order) || 0,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      if (editSlide) {
        const { error } = await supabase.from("slider_items").update(payload).eq("id", editSlide.id);
        if (error) throw error;
        setSlides((prev) => prev.map((s) => s.id === editSlide.id ? { ...s, ...payload } : s));
        toast.success("Slide updated");
      } else {
        const { data, error } = await supabase.from("slider_items").insert(payload).select().single();
        if (error) throw error;
        setSlides((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order));
        toast.success("Slide added");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save slide");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: any) {
    const next = !s.is_active;
    const { error } = await supabase.from("slider_items").update({ is_active: next }).eq("id", s.id);
    if (!error) setSlides((prev) => prev.map((x) => x.id === s.id ? { ...x, is_active: next } : x));
  }

  async function moveSlide(id: string, dir: "up" | "down") {
    const idx = slides.findIndex((s) => s.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= slides.length) return;

    const updated = [...slides];
    const aOrder = updated[idx].sort_order;
    const bOrder = updated[swapIdx].sort_order;

    // Swap sort orders (or use index if equal)
    const newA = bOrder !== aOrder ? bOrder : (dir === "up" ? aOrder - 1 : aOrder + 1);
    const newB = aOrder;

    await Promise.all([
      supabase.from("slider_items").update({ sort_order: newA }).eq("id", updated[idx].id),
      supabase.from("slider_items").update({ sort_order: newB }).eq("id", updated[swapIdx].id),
    ]);

    updated[idx] = { ...updated[idx], sort_order: newA };
    updated[swapIdx] = { ...updated[swapIdx], sort_order: newB };
    setSlides(updated.sort((a, b) => a.sort_order - b.sort_order));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("slider_items").delete().eq("id", deleteTarget.id);
    if (!error) {
      setSlides((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Slide deleted");
    } else toast.error(error.message);
    setDeleteTarget(null);
  }

  if (!ready) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Hero Slider</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {slides.filter((s) => s.is_active).length} active · {slides.length} total — changes publish instantly to the homepage
          </p>
        </div>
        <Button onClick={openAdd} className="shadow-elegant">
          <Plus className="mr-2 h-4 w-4" /> Add Slide
        </Button>
      </div>

      {/* Slide list */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
          Loading slides…
        </div>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
          <Images className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No slides yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">The homepage shows a static fallback until you add slides</p>
          <Button onClick={openAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add your first slide
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {slides.map((slide, idx) => (
            <div key={slide.id} className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-card-soft">
              {/* Thumbnail */}
              <div className="h-20 w-32 shrink-0 rounded-xl overflow-hidden bg-muted">
                {slide.image_url ? (
                  <img src={slide.image_url} alt={slide.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{slide.title}</p>
                  <Badge variant={slide.is_active ? "default" : "secondary"}>
                    {slide.is_active ? "Active" : "Hidden"}
                  </Badge>
                </div>
                {slide.subtitle && <p className="text-sm text-muted-foreground mt-0.5">{slide.subtitle}</p>}
                {slide.button_text && (
                  <p className="text-xs text-primary mt-1">Button: {slide.button_text} → {slide.button_link || "/"}</p>
                )}
              </div>

              {/* Order controls */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSlide(slide.id, "up")}
                  disabled={idx === 0}
                  className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => moveSlide(slide.id, "down")}
                  disabled={idx === slides.length - 1}
                  className="grid h-7 w-7 place-items-center rounded-md border bg-background text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Active toggle */}
              <Switch checked={!!slide.is_active} onCheckedChange={() => toggleActive(slide)} />

              {/* Actions */}
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => openEdit(slide)} className="h-9 w-9">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  onClick={() => setDeleteTarget(slide)}
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetDialog(); setDialogOpen(o); }}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editSlide ? "Edit Slide" : "Add New Slide"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Banner Image */}
            <div className="space-y-2">
              <Label>Banner Image {!editSlide && <span className="text-destructive">*</span>}</Label>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {previewSrc ? (
                <div className="relative group rounded-xl overflow-hidden border bg-muted">
                  <img src={previewSrc} alt="Preview" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>Change</Button>
                    <Button size="sm" variant="destructive" onClick={() => { setImageFile(null); setLocalPreview(""); setExistingImageUrl(""); }}>Remove</Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-40 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Click to upload banner image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — recommended 1600×700px</p>
                </button>
              )}
              {uploading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Premium helmet visors, built for the road."
                autoFocus
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1.5">
              <Label>Subtitle <span className="text-xs text-muted-foreground font-normal">(badge text above title)</span></Label>
              <Input
                value={form.subtitle}
                onChange={(e) => setField("subtitle", e.target.value)}
                placeholder="e.g. New Season · 2026"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Short text shown below the title…"
              />
            </div>

            {/* Button */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Button Text</Label>
                <Input
                  value={form.button_text}
                  onChange={(e) => setField("button_text", e.target.value)}
                  placeholder="e.g. Shop Now"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Button Link</Label>
                <Input
                  value={form.button_link}
                  onChange={(e) => setField("button_link", e.target.value)}
                  placeholder="/store or https://…"
                />
              </div>
            </div>

            {/* Order + Active */}
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setField("sort_order", e.target.value)}
                  placeholder="0"
                />
              </div>
              <label className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-muted/40">
                <span className="text-sm font-medium">Active</span>
                <Switch checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="min-w-28">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{uploading ? "Uploading…" : "Saving…"}</> : editSlide ? "Save Changes" : "Add Slide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete slide?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            "<strong>{deleteTarget?.title}</strong>" will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
