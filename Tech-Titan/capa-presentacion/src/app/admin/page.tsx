"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Shield, Cpu, Plus, Trash2, RefreshCw, Database,
  AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { HardwareIcon } from "@/components/HardwareIcon";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HardwareRow {
  id:       string;
  name:     string;
  category: string;
  metadata: Record<string, unknown>;
}

interface AddForm {
  name:     string;
  category: string;
  socket_type:    string;
  form_factor:    string;
  ram_generation: string;
  tdp_watts:      string;
  wattage_watts:  string;
}

const EMPTY_FORM: AddForm = {
  name: "", category: "CPU",
  socket_type: "", form_factor: "", ram_generation: "",
  tdp_watts: "", wattage_watts: "",
};

const CATEGORIES = ["CPU", "Motherboard", "RAM", "GPU", "PSU", "Storage"];
const BACKEND = "/api/backend";

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAllProducts(): Promise<HardwareRow[]> {
  const res = await fetch(`${BACKEND}/store/pc-builder/products`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al cargar productos");
  const data = await res.json() as { products: HardwareRow[] };
  return data.products;
}

async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${BACKEND}/store/admin/hardware/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al eliminar");
  }
}

async function createProduct(form: AddForm): Promise<void> {
  const metadata: Record<string, unknown> = {};
  if (form.socket_type)    metadata.socket_type    = form.socket_type;
  if (form.form_factor)    metadata.form_factor    = form.form_factor;
  if (form.ram_generation) metadata.ram_generation = form.ram_generation;
  if (form.tdp_watts)      metadata.tdp_watts      = Number(form.tdp_watts);
  if (form.wattage_watts)  metadata.wattage_watts  = Number(form.wattage_watts);

  const res = await fetch(`${BACKEND}/store/admin/hardware`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: form.name, category: form.category, metadata }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? "Error al crear producto");
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState<AddForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-hardware"],
    queryFn: fetchAllProducts,
  });

  const addMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-hardware"] });
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success("Componente creado exitosamente");
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

  // Group by category
  const byCategory = products.reduce<Record<string, HardwareRow[]>>((acc, p) => {
    (acc[p.category] ??= []).push(p);
    return acc;
  }, {});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    addMutation.mutate(form);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="glass-card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Shield size={20} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Hardware Admin</h1>
            <p className="text-xs text-gray-500 font-mono">
              {products.length} componentes · Tech-Titan Control Panel
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-ghost py-1.5 text-xs">
            <RefreshCw size={13} /> Recargar
          </button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="btn-neon py-1.5 text-xs"
          >
            {showAdd ? <ChevronUp size={13} /> : <Plus size={13} />}
            {showAdd ? "Cancelar" : "Añadir componente"}
          </button>
        </div>
      </div>

      {/* ── Warning: admin endpoints ──────────────────────────────────── */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
        <span>
          Las operaciones de escritura (Añadir / Eliminar) requieren los endpoints
          <code className="mx-1 text-amber-300">/store/admin/hardware</code>
          en el backend. Si ves errores 404, sigue los pasos de configuración del backend abajo.
        </span>
      </div>

      {/* ── Add form ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="glass-card p-5 space-y-4 overflow-hidden"
          >
            <h2 className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
              Nuevo Componente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Nombre *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ej: AMD Ryzen 9 7950X"
                  className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                  required
                />
              </div>
              {/* Categoría */}
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
              {/* Socket */}
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase">Socket</label>
                <select
                  value={form.socket_type}
                  onChange={(e) => setForm({ ...form, socket_type: e.target.value })}
                  className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">— Ninguno —</option>
                  {["AM4", "AM5", "LGA1700", "LGA1200"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {/* Form Factor */}
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase">Form Factor</label>
                <select
                  value={form.form_factor}
                  onChange={(e) => setForm({ ...form, form_factor: e.target.value })}
                  className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">— Ninguno —</option>
                  {["ATX", "MATX", "ITX"].map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {/* RAM Gen */}
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase">RAM Generation</label>
                <select
                  value={form.ram_generation}
                  onChange={(e) => setForm({ ...form, ram_generation: e.target.value })}
                  className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="">— Ninguno —</option>
                  {["DDR4", "DDR5"].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* TDP */}
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase">TDP (Watts)</label>
                <input
                  type="number" min="0" max="999"
                  value={form.tdp_watts}
                  onChange={(e) => setForm({ ...form, tdp_watts: e.target.value })}
                  placeholder="ej: 125"
                  className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              {/* Wattage PSU */}
              <div>
                <label className="text-[10px] font-mono text-gray-500 uppercase">Wattage PSU (solo PSU)</label>
                <input
                  type="number" min="0" max="2000"
                  value={form.wattage_watts}
                  onChange={(e) => setForm({ ...form, wattage_watts: e.target.value })}
                  placeholder="ej: 850"
                  className="mt-1 w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="btn-neon text-xs py-2 w-full justify-center"
            >
              {addMutation.isPending ? "Guardando..." : "Guardar componente"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Product table ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="glass-card p-10 text-center">
          <Database size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-mono animate-pulse">Cargando componentes...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center border-red-500/20">
          <p className="text-sm text-red-400">Error: {(error as Error).message}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORIES.filter((cat) => byCategory[cat]?.length).map((cat) => (
            <div key={cat} className="glass-card overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-800/60 bg-gray-900/40">
                <HardwareIcon category={cat} size={14} className="text-cyan-400" />
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">{cat}</span>
                <span className="ml-auto text-[10px] text-gray-600 font-mono">{byCategory[cat]?.length} items</span>
              </div>

              {/* Rows */}
              {byCategory[cat]?.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/30 last:border-0 hover:bg-gray-800/20 transition-colors">
                  {/* Name + specs */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{p.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(p.metadata).map(([k, v]) => (
                        <span key={k} className="badge-gray text-[10px]">
                          {k.replace(/_/g, " ")}: {String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {/* ID */}
                  <span className="hidden md:block text-[10px] font-mono text-gray-700 flex-shrink-0">
                    {p.id.slice(0, 8)}…
                  </span>
                  {/* Delete */}
                  {deleteId === p.id ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => delMutation.mutate(p.id)}
                        disabled={delMutation.isPending}
                        className="text-[11px] px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
                      >
                        Confirmar
                      </button>
                      <button onClick={() => setDeleteId(null)} className="text-[11px] px-2 py-1 rounded text-gray-500 hover:text-gray-300">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteId(p.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── MedusaJS admin link ─────────────────────────────────────────── */}
      <div className="glass-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-white">Panel MedusaJS (Órdenes / Clientes)</p>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">
            Gestión de pedidos, clientes, descuentos y configuración de la tienda
          </p>
        </div>
        <a
          href="http://localhost:9000/app"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-xs py-1.5 flex-shrink-0"
        >
          Abrir → localhost:9000/app
        </a>
      </div>
    </main>
  );
}
