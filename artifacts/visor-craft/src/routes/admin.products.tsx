import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/lib/require-auth";
import { resolveProductImage } from "@/lib/product-images";
import { formatPrice } from "@/lib/site";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Search, Star,
  ImagePlus, X, Package, Tag, IndianRupee, Wrench, FileText, Eye,
} from "lucide-react";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

// ── helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

type SpecRow = { key: string; value: string };

function specsToRows(specs: Record<string, string> | null | undefined): SpecRow[] {
  if (!specs || typeof specs !== "object" || Object.keys(specs).length === 0)
    return [{ key: "", value: "" }];
  return Object.entries(specs).map(([key, value]) => ({ key, value }));
}

function rowsToSpecs(rows: SpecRow[]): Record<string, string> {
  const out: Record<string, string> = {};
  rows.forEach(({ key, value }) => { if (key.trim()) out[key.trim()] = value.trim(); });
  return out;
}

const defaultForm = {
  name: "", slug: "", short_description: "", description: "",
  main_category_id: "", category_id: "",
  price: "", compare_at_price: "", stock: "0",
  is_featured: false, is_active: true,
};
type FormState = typeof defaultForm;

// ── upload ────────────────────────────────────────────────────────────────────

async function uploadToStorage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "31536000", contentType: file.type });

  if (error) {
    // Bucket doesn't exist yet — guide admin to create it
    const msg = error.message ?? "";
    if (
      msg.toLowerCase().includes("not found") ||
      msg.toLowerCase().includes("bucket") ||
      (error as any)?.statusCode === "404" ||
      (error as any)?.statusCode === 404
    ) {
      throw new Error(
        'Storage bucket "product-images" not found. ' +
        'Go to your Supabase dashboard → Storage → New Bucket → name it "product-images" (public). ' +
        'Then re-run supabase-setup.sql from the project root.'
      );
    }
    throw new Error(error.message ?? "Image upload failed");
  }

  const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(data.path);
  return urlData.publicUrl;
}

// ── component ─────────────────────────────────────────────────────────────────

function AdminProducts() {
  const ready = useRequireAdmin();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // Form fields
  const [form, setForm] = useState<FormState>(defaultForm);
  const [slugManual, setSlugManual] = useState(false);
  const [specRows, setSpecRows] = useState<SpecRow[]>([{ key: "", value: "" }]);

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState(""); // blob URL for selected file
  const [existingImageUrl, setExistingImageUrl] = useState(""); // URL for saved image
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // ── data ──
  useEffect(() => { if (ready) fetchAll(); }, [ready]);

  async function fetchAll() {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setProducts(prods ?? []);
    setCategories(cats ?? []);
    setLoading(false);
  }

  // ── dialog helpers ──
  function resetDialog() {
    setForm(defaultForm);
    setSlugManual(false);
    setSpecRows([{ key: "", value: "" }]);
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl("");
  }

  function openAdd() {
    setEditProduct(null);
    resetDialog();
    setDialogOpen(true);
  }

  function openEdit(p: any) {
    setEditProduct(p);
    setSlugManual(true);
    // Derive main_category_id: if the product's category has a parent_id, use that; otherwise it IS a main category
    const subCat = categories.find((c: any) => c.id === p.category_id);
    const mainCatId = subCat?.parent_id ?? (subCat && !subCat.parent_id ? "" : "");
    setForm({
      name: p.name ?? "",
      slug: p.slug ?? "",
      short_description: p.short_description ?? "",
      description: p.description ?? "",
      main_category_id: mainCatId,
      category_id: p.category_id ?? "",
      price: p.price_cents ? String(Math.round(p.price_cents / 100)) : "",
      compare_at_price: p.compare_at_price_cents ? String(Math.round(p.compare_at_price_cents / 100)) : "",
      stock: String(p.stock ?? 0),
      is_featured: !!p.is_featured,
      is_active: p.is_active !== false,
    });
    setSpecRows(specsToRows(p.specs));
    setImageFile(null);
    setLocalPreview("");
    setExistingImageUrl(p.primary_image_url ?? "");
    setDialogOpen(true);
  }

  function setField(k: keyof FormState, v: any) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "name" && !slugManual) next.slug = slugify(v as string);
      // Changing main category clears the subcategory selection
      if (k === "main_category_id") next.category_id = "";
      return next;
    });
  }

  // Derived category lists for cascading dropdowns
  const mainCategories = categories.filter((c: any) => !c.parent_id);
  const availableSubcategories = form.main_category_id
    ? categories.filter((c: any) => c.parent_id === form.main_category_id)
    : [];

  // ── image ──
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

  const previewSrc = localPreview || (existingImageUrl ? resolveProductImage(existingImageUrl) : "");

  // ── specs ──
  function addSpec() { setSpecRows((r) => [...r, { key: "", value: "" }]); }
  function removeSpec(i: number) { setSpecRows((r) => r.filter((_, j) => j !== i)); }
  function updateSpec(i: number, field: "key" | "value", val: string) {
    setSpecRows((r) => r.map((s, j) => j === i ? { ...s, [field]: val } : s));
  }

  // ── discount badge ──
  const price = parseFloat(form.price);
  const compareAt = parseFloat(form.compare_at_price);
  const discount = price > 0 && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;

  // ── save ──
  async function handleSave() {
    if (!form.name.trim()) { toast.error("Product name is required"); return; }
    if (!form.price || isNaN(Number(form.price))) { toast.error("Enter a valid price"); return; }

    setSaving(true);
    let imageUrl = existingImageUrl || null;

    if (imageFile) {
      setUploading(true);
      try {
        imageUrl = await uploadToStorage(imageFile);
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
      slug: form.slug.trim() || slugify(form.name),
      short_description: form.short_description.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      price_cents: Math.round(parseFloat(form.price) * 100),
      compare_at_price_cents: form.compare_at_price ? Math.round(parseFloat(form.compare_at_price) * 100) : null,
      stock: parseInt(form.stock) || 0,
      is_featured: form.is_featured,
      is_active: form.is_active,
      primary_image_url: imageUrl,
      specs: rowsToSpecs(specRows),
    };

    try {
      if (editProduct) {
        const { error } = await supabase.from("products").update(payload).eq("id", editProduct.id);
        if (error) throw error;
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...payload } : p));
        toast.success("Product updated");
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select().single();
        if (error) throw error;
        setProducts((prev) => [data, ...prev]);
        toast.success("Product added to store!");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  // ── toggle active ──
  async function toggleActive(p: any) {
    const next = !p.is_active;
    const { error } = await supabase.from("products").update({ is_active: next }).eq("id", p.id);
    if (!error) setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: next } : x));
  }

  // ── delete ──
  async function confirmDelete() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (!error) {
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      toast.success("Product deleted");
    } else toast.error(error.message);
    setDeleteTarget(null);
  }

  if (!ready) return null;

  const filtered = products.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{products.length} total</p>
        </div>
        <Button onClick={openAdd} className="shadow-elegant">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Product table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent mr-3" />
          Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20">
          <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-muted-foreground">No products found</p>
          <Button onClick={openAdd} variant="outline" className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add your first product
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">Stock</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Active</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((product) => {
                const cat = categories.find((c) => c.id === product.category_id);
                return (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveProductImage(product.primary_image_url)}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover shrink-0 bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{product.slug}</p>
                        </div>
                        {product.is_featured && <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {cat ? <Badge variant="secondary">{cat.name}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      <div>{formatPrice(product.price_cents)}</div>
                      {product.compare_at_price_cents && (
                        <div className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price_cents)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className={product.stock <= 5 ? "text-destructive font-semibold" : ""}>{product.stock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={!!product.is_active} onCheckedChange={() => toggleActive(product)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)} className="h-8 w-8">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => setDeleteTarget(product)}
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

      {/* ── Add / Edit Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetDialog(); setDialogOpen(o); }}>
        <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="font-display text-xl">
              {editProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-6 mt-4">

            {/* ① Product Image */}
            <Section icon={<ImagePlus className="h-4 w-4" />} title="Product Image">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

              {previewSrc ? (
                <div className="relative group rounded-xl overflow-hidden border bg-muted">
                  <img src={previewSrc} alt="Preview" className="w-full h-52 object-contain" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="secondary" type="button" onClick={() => fileInputRef.current?.click()}>
                      Change Image
                    </Button>
                    <Button size="sm" variant="destructive" type="button" onClick={removeImage}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-44 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG, WEBP up to 5 MB</p>
                  </div>
                </button>
              )}
              {uploading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                  Uploading image…
                </div>
              )}
            </Section>

            <Divider />

            {/* ② Basic Details */}
            <Section icon={<FileText className="h-4 w-4" />} title="Basic Details">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">Product Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="p-name"
                    placeholder="e.g. Royal Blue Mirror Visor"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-slug" className="flex items-center gap-1.5">
                    URL Slug
                    <span className="text-xs text-muted-foreground font-normal">(auto-generated)</span>
                  </Label>
                  <div className="flex items-center rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                    <span className="px-3 py-2 text-xs text-muted-foreground bg-muted border-r border-input shrink-0">/products/</span>
                    <input
                      id="p-slug"
                      value={form.slug}
                      onChange={(e) => { setSlugManual(true); setField("slug", e.target.value); }}
                      placeholder="royal-blue-mirror-visor"
                      className="flex-1 px-3 py-2 text-sm font-mono bg-background outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-short">Short Description</Label>
                  <Input
                    id="p-short"
                    placeholder="One-line summary shown on product cards"
                    value={form.short_description}
                    onChange={(e) => setField("short_description", e.target.value)}
                  />
                </div>
              </div>
            </Section>

            <Divider />

            {/* ③ Category & Stock */}
            <Section icon={<Tag className="h-4 w-4" />} title="Category & Inventory">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Main Category</Label>
                    <Select value={form.main_category_id} onValueChange={(v) => setField("main_category_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select main…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {mainCategories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Subcategory</Label>
                    <Select
                      value={form.category_id}
                      onValueChange={(v) => setField("category_id", v)}
                      disabled={!form.main_category_id || availableSubcategories.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={!form.main_category_id ? "Pick main first" : "Select sub…"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {availableSubcategories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-stock">Stock Quantity</Label>
                  <Input
                    id="p-stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setField("stock", e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </Section>

            <Divider />

            {/* ④ Pricing */}
            <Section icon={<IndianRupee className="h-4 w-4" />} title="Pricing">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="p-price">Selling Price <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input id="p-price" type="number" min="0" value={form.price} onChange={(e) => setField("price", e.target.value)} className="pl-7" placeholder="899" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-compare">
                    Original Price
                    <span className="text-xs text-muted-foreground font-normal ml-1">(shown crossed-out)</span>
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input id="p-compare" type="number" min="0" value={form.compare_at_price} onChange={(e) => setField("compare_at_price", e.target.value)} className="pl-7" placeholder="1299" />
                  </div>
                </div>
              </div>
              {discount > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  <span className="text-base">🎉</span>
                  Customers will see <strong>{discount}% off</strong> on this product
                </div>
              )}
            </Section>

            <Divider />

            {/* ⑤ Specifications */}
            <Section icon={<Wrench className="h-4 w-4" />} title="Specifications">
              <div className="space-y-2">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                  <span>Spec name</span><span>Value</span><span />
                </div>
                {specRows.map((spec, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                    <Input
                      placeholder="e.g. Material"
                      value={spec.key}
                      onChange={(e) => updateSpec(i, "key", e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      placeholder="e.g. Polycarbonate"
                      value={spec.value}
                      onChange={(e) => updateSpec(i, "value", e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      variant="ghost" size="icon" type="button"
                      onClick={() => removeSpec(i)}
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      disabled={specRows.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" type="button" onClick={addSpec} className="mt-1">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Spec
                </Button>
              </div>
            </Section>

            <Divider />

            {/* ⑥ Full Description */}
            <Section icon={<FileText className="h-4 w-4" />} title="Full Description">
              <textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Detailed product description shown on the product page…"
              />
            </Section>

            <Divider />

            {/* ⑦ Visibility */}
            <Section icon={<Eye className="h-4 w-4" />} title="Visibility">
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Active — visible in store</p>
                    <p className="text-xs text-muted-foreground">Customers can browse and buy this product</p>
                  </div>
                  <Switch checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
                </label>
                <label className="flex items-center justify-between p-3 rounded-xl border cursor-pointer hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium">Featured — highlighted on home page</p>
                    <p className="text-xs text-muted-foreground">Shown in the featured section on the homepage</p>
                  </div>
                  <Switch checked={form.is_featured} onCheckedChange={(v) => setField("is_featured", v)} />
                </label>
              </div>
            </Section>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30 gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="shadow-elegant min-w-32">
              {saving ? (uploading ? "Uploading…" : "Saving…") : editProduct ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "<strong>{deleteTarget?.name}</strong>" will be permanently removed. This cannot be undone.
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

// ── small layout helpers ──────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-border" />;
}
