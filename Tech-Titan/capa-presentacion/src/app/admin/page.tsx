"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Shield, Plus, Trash2, RefreshCw, Database, AlertTriangle,
  ChevronDown, ChevronUp, Pencil, Search, X, Package,
  DollarSign, Layers, Image as ImageIcon,
} from "lucide-react";
import { HardwareIcon } from "@/components/HardwareIcon";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HardwareRow {
  id:          string;
  name:        string;
  category:    string;
  price_usd:   number;
  stock:       number;
  svg_key?:    string;
  description?: string;
  metadata:    Record<string, unknown>;
  updated_at:  string;
}

interface ProductForm {
  name:               string;
  category:           string;
  price_usd:          string;
  stock:              string;
  svg_key:            string;
  description:        string;
  socket_type:        string;
  form_factor:        string;
  ram_generation:     string;
  tdp_watts:          string;
  wattage_watts:      string;
  capacity_gb:        string;
  vram_gb:            string;
  speed_mhz:          string;
  storage_capacity_gb: string;
  interface_type:     string;
  cooler_type:        string;
  tdp_rating:         string;
}

const EMPTY_FORM: ProductForm = {
  name: "", category: "CPU", price_usd: "", stock: "0",
  svg_key: "", description: "",
  socket_type: "", form_factor: "", ram_generation: "",
  tdp_watts: "", wattage_watts: "", capacity_gb: "", vram_gb: "",
  speed_mhz: "", storage_capacity_gb: "", interface_type: "",
  cooler_type: "", tdp_rating: "",
};

const CATEGORIES = ["CPU", "Motherboard", "RAM", "GPU", "PSU", "Storage", "Case", "Cooler"];
const BACKEND    = "/api/backend";

// Sugerencias de svg_key por categoría
const SVG_SUGGESTIONS: Record<string, string[]> = {
  CPU:         ["cpu-amd", "cpu-intel"],
  GPU:         ["gpu-nvidia", "gpu-amd"],
  RAM:         ["ram", "ram-corsair", "ram-gskill"],
  Motherboard: ["motherboard"],
  PSU:         ["psu", "psu-corsair"],
  Storage:     ["storage-nvme", "storage-sata", "storage-hdd"],
  Case:        ["case"],
  Cooler:      ["cooler-air", "cooler-aio"],
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAllProducts(): Promise<HardwareRow[]> {
  const res = await fetch(`${BACKEND}/store/admin/hardware`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar componentes");
  const data = await res.json() as { components: HardwareRow[] };
  return data.components;
}

function formToPayload(form: ProductForm) {
  const metadata: Record<string, unknown> = {};
  if (form.socket_type)         metadata.socket_type         = form.socket_type;
  if (form.form_factor)         metadata.form_factor         = form.form_factor;
  if (form.ram_generation)      metadata.ram_generation      = form.ram_generation;
  if (form.tdp_watts)           metadata.tdp_watts           = Number(form.tdp_watts);
  if (form.wattage_watts)       metadata.wattage_watts       = Number(form.wattage_watts);
  if (form.capacity_gb)         metadata.capacity_gb         = Number(form.capacity_gb);
  if (form.vram_gb)             metadata.vram_gb             = Number(form.vram_gb);
  if (form.speed_mhz)           metadata.speed_mhz           = Number(form.speed_mhz);
  if (form.storage_capacity_gb) metadata.storage_capacity_gb = Number(form.storage_capacity_gb);
  if (form.interface_type)      metadata.interface_type      = form.interface_type;
  if (form.cooler_type)         metadata.cooler_type         = form.cooler_type;
  if (form.tdp_rating)          metadata.tdp_rating          = Number(form.tdp_rating);

  return {
    name:        form.name.trim(),
    category:    form.category,
    price_usd:   Number(form.price_usd) || 0,
    stock:       Number(form.stock) || 0,
    svg_key:     form.svg_key.trim() || undefined,
    description: form.description.trim() || undefined,
    metadata,
  };
}

async function createProduct(form: ProductForm): Promise<void> {
  const res = await fetch(`${BACKEND}/store/admin/hardware`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formToPayload(form)),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al crear componente");
  }
}

async function updateProduct(id: string, form: ProductForm): Promise<void> {
  const res = await fetch(`${BACKEND}/store/admin/hardware/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formToPayload(form)),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al actualizar");
  }
}

async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BACKEND}/store/admin/hardware/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al eliminar");
  }
}

// ─── Stock badge ──────────────────────────────────────────────────────────────

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/25">Sin stock</span>;
  if (stock <= 5)  return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">{stock} uds</span>;
  return <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{stock} uds</span>;
}

// ─── Product image preview ────────────────────────────────────────────────────

function SvgPreview({ svgKey, category }: { svgKey?: string; category: string }) {
  if (!svgKey) return <HardwareIcon category={category} size={18} className="text-gray-600" />;
  return (
    <img
      src={`/hardware/${svgKey}.svg`}
      alt={svgKey}
      width={20}
      height={20}
      className="object-contain"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// ─── Form component ───────────────────────────────────────────────────────────

function ProductFormFields({ form, setForm }: { form: ProductForm; setForm: (f: ProductForm) => void }) {
  const suggestions = SVG_SUGGESTIONS[form.category] ?? [];

  const field = (key: keyof ProductForm, label: string, extra?: Partial<React.InputHTMLAttributes<HTMLInputElement>>) => (
    <div key={key}>
      <label className="text-[10px] font-mono text-gray-500 uppercase">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
        {...extra}
      />
    </div>
  );

  const sel = (key: keyof ProductForm, label: string, opts: string[]) => (
    <div key={key}>
      <label className="text-[10px] font-mono text-gray-500 uppercase">{label}</label>
      <select
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
      >
        <option value="">— Ninguno —</option>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Fila 1: nombre + categoría */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-mono text-gray-500 uppercase">Nombre *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="ej: AMD Ryzen 9 7950X"
            required
            className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-gray-500 uppercase">Categoría</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Fila 2: precio + stock */}
      <div className="grid grid-cols-2 gap-3">
        {field("price_usd", "Precio USD *", { type: "number", min: "0", step: "0.01", placeholder: "ej: 299.99" })}
        {field("stock",     "Stock (unidades)", { type: "number", min: "0", placeholder: "ej: 10" })}
      </div>

      {/* Fila 3: svg_key + preview */}
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1">
          <ImageIcon size={9} /> Imagen SVG key
        </label>
        <div className="flex gap-2 mt-1">
          <div className="relative flex-1">
            <input
              value={form.svg_key}
              onChange={(e) => setForm({ ...form, svg_key: e.target.value })}
              placeholder="ej: cpu-amd"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="w-10 h-10 rounded-lg border border-gray-700/50 bg-gray-800/50 flex items-center justify-center flex-shrink-0">
            <SvgPreview svgKey={form.svg_key || undefined} category={form.category} />
          </div>
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm({ ...form, svg_key: s })}
                className={cn(
                  "text-[10px] font-mono px-2 py-0.5 rounded-md border transition-colors",
                  form.svg_key === s
                    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                    : "border-gray-700/50 text-gray-500 hover:border-gray-600 hover:text-gray-400"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Descripción */}
      <div>
        <label className="text-[10px] font-mono text-gray-500 uppercase">Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción breve del producto..."
          rows={2}
          className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 resize-none"
        />
      </div>

      {/* Specs técnicas */}
      <details className="group">
        <summary className="cursor-pointer text-[10px] font-mono text-gray-500 uppercase tracking-widest list-none flex items-center gap-1 hover:text-gray-400 transition-colors">
          <Layers size={9} />
          Especificaciones técnicas
          <ChevronDown size={9} className="group-open:rotate-180 transition-transform" />
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
          {sel("socket_type",    "Socket",        ["AM4", "AM5", "LGA1700", "LGA1200"])}
          {sel("form_factor",    "Form Factor",   ["ATX", "MATX", "ITX"])}
          {sel("ram_generation", "RAM Gen",       ["DDR4", "DDR5"])}
          {sel("interface_type", "Storage Interface", ["NVMe_PCIe4", "NVMe_PCIe3", "SATA", "HDD"])}
          {sel("cooler_type",    "Cooler Type",   ["Stock", "Air", "AIO_120", "AIO_240", "AIO_280", "AIO_360"])}
          {field("tdp_watts",           "TDP (W)",          { type: "number", min: "0" })}
          {field("wattage_watts",       "Wattage PSU (W)",  { type: "number", min: "0" })}
          {field("capacity_gb",         "Capacidad RAM (GB)", { type: "number", min: "0" })}
          {field("vram_gb",             "VRAM (GB)",         { type: "number", min: "0" })}
          {field("speed_mhz",           "Velocidad (MHz)",   { type: "number", min: "0" })}
          {field("storage_capacity_gb", "Storage (GB)",      { type: "number", min: "0" })}
          {field("tdp_rating",          "TDP Rating cooler", { type: "number", min: "0" })}
        </div>
      </details>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const qc = useQueryClient();
  const [showAdd,  setShowAdd]  = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form,     setForm]     = useState<ProductForm>(EMPTY_FORM);
  const [search,   setSearch]   = useState("");

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-hardware"],
    queryFn:  fetchAllProducts,
  });

  const addMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hardware"] });
      setForm(EMPTY_FORM); setShowAdd(false);
      toast.success("Componente creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: ProductForm }) => updateProduct(id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hardware"] });
      setEditId(null); setForm(EMPTY_FORM);
      toast.success("Componente actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hardware"] });
      setDeleteId(null);
      toast.success("Componente eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function startEdit(p: HardwareRow) {
    const m = p.metadata as Record<string, string | number>;
    setForm({
      name: p.name, category: p.category,
      price_usd: String(p.price_usd), stock: String(p.stock),
      svg_key: p.svg_key ?? "", description: p.description ?? "",
      socket_type:        String(m.socket_type        ?? ""),
      form_factor:        String(m.form_factor        ?? ""),
      ram_generation:     String(m.ram_generation     ?? ""),
      tdp_watts:          String(m.tdp_watts          ?? ""),
      wattage_watts:      String(m.wattage_watts      ?? ""),
      capacity_gb:        String(m.capacity_gb        ?? ""),
      vram_gb:            String(m.vram_gb            ?? ""),
      speed_mhz:          String(m.speed_mhz          ?? ""),
      storage_capacity_gb: String(m.storage_capacity_gb ?? ""),
      interface_type:     String(m.interface_type     ?? ""),
      cooler_type:        String(m.cooler_type        ?? ""),
      tdp_rating:         String(m.tdp_rating         ?? ""),
    });
    setEditId(p.id);
    setShowAdd(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    if (editId) {
      editMutation.mutate({ id: editId, form });
    } else {
      addMutation.mutate(form);
    }
  }

  function cancelForm() {
    setShowAdd(false); setEditId(null); setForm(EMPTY_FORM);
  }

  const filtered = search.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  const byCategory = filtered.reduce<Record<string, HardwareRow[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  const isFormOpen = showAdd || editId !== null;
  const isPending  = addMutation.isPending || editMutation.isPending;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Shield size={18} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Hardware Admin</h1>
            <p className="text-[10px] text-gray-500 font-mono">
              {products.length} componentes · Tech-Titan
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => refetch()} className="btn-ghost py-1.5 text-xs">
            <RefreshCw size={12} /> Recargar
          </button>
          <button
            onClick={() => { cancelForm(); setShowAdd((v) => !v); }}
            className="btn-neon py-1.5 text-xs"
          >
            {isFormOpen ? <X size={12} /> : <Plus size={12} />}
            {isFormOpen ? "Cancelar" : "Añadir"}
          </button>
        </div>
      </div>

      {/* ── Warning ──────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
        <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          Requiere el backend Express en <code className="text-amber-300 mx-1">localhost:9000</code>.
          Para los SVGs, coloca archivos en <code className="text-amber-300 mx-1">public/hardware/&lt;key&gt;.svg</code>.
        </span>
      </div>

      {/* ── Add / Edit form ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass-card p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                {editId ? "✎ Editar componente" : "+ Nuevo componente"}
              </h2>
              <button type="button" onClick={cancelForm} className="text-gray-600 hover:text-gray-400">
                <X size={14} />
              </button>
            </div>

            <ProductFormFields form={form} setForm={setForm} />

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={cancelForm} className="btn-ghost text-xs py-2 flex-1 justify-center">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="btn-neon text-xs py-2 flex-1 justify-center">
                {isPending ? "Guardando..." : editId ? "Guardar cambios" : "Crear componente"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="w-full bg-gray-900/60 border border-gray-800/60 rounded-xl pl-8 pr-10 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Product table ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="glass-card p-10 text-center">
          <Database size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-mono animate-pulse">Cargando componentes...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center border-red-500/20">
          <p className="text-sm text-red-400">Error: {(error as Error).message}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <Package size={28} className="text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{search ? "Sin resultados para tu búsqueda" : "Sin componentes. Añade el primero."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.filter((cat) => byCategory[cat]?.length).map((cat) => (
            <div key={cat} className="glass-card overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800/60 bg-gray-900/30">
                <HardwareIcon category={cat} size={13} className="text-cyan-400" />
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">{cat}</span>
                <span className="ml-auto text-[10px] text-gray-600 font-mono">{byCategory[cat]?.length} item(s)</span>
              </div>

              {/* Rows */}
              {byCategory[cat]?.map((p) => (
                <motion.div
                  key={p.id}
                  layout
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 border-b border-gray-800/20 last:border-0 transition-colors",
                    editId === p.id ? "bg-cyan-500/5 border-l-2 border-l-cyan-500/50" : "hover:bg-gray-800/20"
                  )}
                >
                  {/* SVG icon */}
                  <div className="w-9 h-9 rounded-lg bg-gray-800/60 border border-gray-700/40 flex items-center justify-center flex-shrink-0 p-1.5">
                    <SvgPreview svgKey={p.svg_key} category={p.category} />
                  </div>

                  {/* Name + specs */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{p.name}</p>
                    {p.description && (
                      <p className="text-[10px] text-gray-600 truncate mt-0.5">{p.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(p.metadata).slice(0, 4).map(([k, v]) => (
                        <span key={k} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-800/60 text-gray-500 border border-gray-700/30">
                          {k.replace(/_/g, " ")}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <p className="text-sm font-bold text-cyan-400 flex items-center gap-1 justify-end">
                      <DollarSign size={10} />{p.price_usd.toLocaleString()}
                    </p>
                    <StockBadge stock={p.stock} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => editId === p.id ? cancelForm() : startEdit(p)}
                      title={editId === p.id ? "Cancelar edición" : "Editar"}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        editId === p.id
                          ? "text-cyan-400 bg-cyan-500/10"
                          : "text-gray-600 hover:text-cyan-400 hover:bg-cyan-500/5"
                      )}
                    >
                      <Pencil size={13} />
                    </button>

                    {deleteId === p.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => delMutation.mutate(p.id)}
                          disabled={delMutation.isPending}
                          className="text-[10px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                          ¿Eliminar?
                        </button>
                        <button onClick={() => setDeleteId(null)} className="text-gray-600 hover:text-gray-400 p-1">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="text-gray-700 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/5"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
