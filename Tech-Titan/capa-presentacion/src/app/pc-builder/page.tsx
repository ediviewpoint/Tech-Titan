"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useShallow } from "zustand/react/shallow";
import { toast } from "sonner";
import { RotateCcw, ChevronLeft, ChevronRight, Activity, ShoppingCart, Save, FileText, Sparkles, Search, X, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { StepIndicator, type BuildStep } from "@/components/StepIndicator";
import { BuildManifest } from "@/components/BuildManifest";
import { BudgetModal }   from "@/components/BudgetModal";
import { AIAuditModal } from "@/components/AIAuditModal";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { fetchProducts, validateBuild, fetchProductsByIds } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { HardwareProduct } from "@/types/hardware";
import { ComponentCategory } from "@/types/hardware";
import { useCurrencyStore, formatPrice } from "@/store/currency";
import {
  usePCBuilderStore,
  selectSelectedProducts,
  selectTotalPrice,
} from "@/store/pc-builder";
import type { PCBuilderState } from "@/store/pc-builder";

// ─── Constants ────────────────────────────────────────────────────────────────

const BUILD_STEPS: readonly BuildStep[] = [
  { index: 0, label: "CPU",         description: "Procesador"            },
  { index: 1, label: "Placa Madre", description: "Placa base"            },
  { index: 2, label: "RAM",         description: "Memoria RAM"           },
  { index: 3, label: "GPU",         description: "Tarjeta gráfica"       },
  { index: 4, label: "PSU",         description: "Fuente de poder"       },
  { index: 5, label: "Storage",     description: "Almacenamiento"        },
  { index: 6, label: "Gabinete",    description: "Case / Gabinete"       },
  { index: 7, label: "Cooler",      description: "Refrigeración"         },
] as const;

// Los primeros 6 pasos son requeridos para BUILD COMPLETE
const REQUIRED_STEPS = 6;

const STEP_CATEGORIES: Record<number, ComponentCategory> = {
  0: ComponentCategory.CPU,
  1: ComponentCategory.MOTHERBOARD,
  2: ComponentCategory.RAM,
  3: ComponentCategory.GPU,
  4: ComponentCategory.PSU,
  5: ComponentCategory.STORAGE,
  6: ComponentCategory.CASE,
  7: ComponentCategory.COOLER,
};

// ─── Hydration wrapper ────────────────────────────────────────────────────────

export default function PCBuilderPage() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    usePCBuilderStore.persist.rehydrate();
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass-card h-[60vh] animate-pulse" />
      </main>
    );
  }

  return <PCBuilderDashboard />;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function PCBuilderDashboard() {
  const router             = useRouter();
  const { data: session }  = useSession();
  const [showBudget,  setShowBudget]  = useState(false);
  const [showAudit,   setShowAudit]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice,    setMinPrice]    = useState("");
  const [maxPrice,    setMaxPrice]    = useState("");
  const prevValidRef = useRef<boolean | null>(null);

  // Zustand (persistido)
  const selected        = usePCBuilderStore((s) => s.selected);
  const currentStep     = usePCBuilderStore((s) => s.currentStep);
  const selectComponent = usePCBuilderStore((s) => s.selectComponent);
  const removeComponent = usePCBuilderStore((s) => s.removeComponent);
  const setStep         = usePCBuilderStore((s) => s.setStep);
  const reset           = usePCBuilderStore((s) => s.reset);
  const loadComponents  = usePCBuilderStore((s: PCBuilderState) => s.loadComponents);
  const selectedList    = usePCBuilderStore(useShallow(selectSelectedProducts));
  const totalPrice      = usePCBuilderStore(selectTotalPrice);

  // ── URL Hydration ──────────────────────────────────────────────────────────
  // Si la URL contiene ?build=id1,id2,id3 y el carrito está vacío, carga el build.
  useEffect(() => {
    const params    = new URLSearchParams(window.location.search);
    const buildParam = params.get("build");
    if (!buildParam) return;
    if (Object.keys(selected).length > 0) return; // no sobreescribir un build activo

    const ids = buildParam.split(",").filter(Boolean);
    if (ids.length === 0) return;

    const tid = toast.loading("Recuperando build desde URL...");
    fetchProductsByIds(ids)
      .then((products) => {
        loadComponents(products);
        toast.success(`Build recuperado — ${products.length} componente(s) cargados`, { id: tid });
        // Limpiar el parámetro de la URL sin recargar la página
        const url = new URL(window.location.href);
        url.searchParams.delete("build");
        window.history.replaceState({}, "", url.toString());
      })
      .catch(() => {
        toast.error("No se pudo recuperar el build desde la URL", { id: tid });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpiar búsqueda al cambiar de categoría
  useEffect(() => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
  }, [currentStep]);

  const currencyStore = useCurrencyStore();
  const category    = STEP_CATEGORIES[currentStep] ?? ComponentCategory.CPU;
  const selectedIds = selectedList.map((p) => p.id);
  const totalTdp    = selectedList.reduce((sum, p) => sum + (p.metadata.tdp_watts ?? 0), 0);

  // TanStack Query: catálogo (caché 5 min)
  const {
    data: products = [],
    isLoading:    loadingProducts,
    error:        productsError,
  } = useQuery({
    queryKey:  ["hardware-products", category],
    queryFn:   () => fetchProducts(category),
    staleTime: 5 * 60 * 1000,
  });

  // Filtrado local (instantáneo, sin round-trip)
  const filteredProducts = useMemo(() => {
    let list = products;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q)
      );
    }
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!isNaN(min)) list = list.filter((p) => p.price_usd >= min);
    if (!isNaN(max)) list = list.filter((p) => p.price_usd <= max);
    return list;
  }, [products, searchQuery, minPrice, maxPrice]);

  const activeFilters = Boolean(searchQuery || minPrice || maxPrice);

  // TanStack Query: validación (sin caché — siempre fresca)
  const sortedKey = [...selectedIds].sort().join(",");
  const {
    data:      validation,
    isFetching: isValidating,
    error:      validationError,
  } = useQuery({
    queryKey:  ["pc-validation", sortedKey],
    queryFn:   () => validateBuild(selectedIds),
    enabled:   selectedIds.length > 0,
    staleTime: 0,
    gcTime:    30_000,
  });

  // ── Toast de validación ────────────────────────────────────────────────────
  useEffect(() => {
    if (!validation) return;
    if (prevValidRef.current === validation.compatible) return;
    prevValidRef.current = validation.compatible;

    if (validation.compatible) {
      toast.success("Build compatible ✓", {
        description: validation.warnings.length > 0
          ? `${validation.warnings.length} aviso(s) menor(es)`
          : "Todos los componentes son compatibles.",
      });
    } else {
      toast.error("Incompatibilidad detectada", {
        description: validation.errors[0] ?? "Revisa el Build Manifest para más detalles.",
      });
    }
  }, [validation]);

  // Handlers
  const handleSelect = useCallback((product: HardwareProduct) => {
    selectComponent(product);
    toast.success(`${product.name}`, { description: `${product.category} añadido al build` });
    if (currentStep < BUILD_STEPS.length - 1) setStep(currentStep + 1);
  }, [currentStep, selectComponent, setStep]);

  const completedSteps = new Set(
    BUILD_STEPS.filter((s) => selected[STEP_CATEGORIES[s.index]!] !== undefined).map((s) => s.index)
  );

  const completedCount    = completedSteps.size;
  const requiredCompleted = BUILD_STEPS.slice(0, REQUIRED_STEPS).filter((s) => selected[STEP_CATEGORIES[s.index]!] !== undefined).length;
  const allSelected       = requiredCompleted === REQUIRED_STEPS;

  const totalPriceFormatted = formatPrice(currencyStore, totalPrice);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

      {/* ── Diagnostic Header ───────────────────────────────────────────── */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">

          {/* Title + status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              <h1 className="text-sm font-mono text-gray-300 uppercase tracking-widest">
                PC Builder <span className="text-cyan-500">// Diagnostic System</span>
              </h1>
            </div>
            <span className={cn(
              "text-[10px] font-mono px-2 py-0.5 rounded-full border",
              allSelected
                ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                : "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
            )}>
              {allSelected ? "BUILD COMPLETE" : `BUILDING ${requiredCompleted}/${REQUIRED_STEPS}`}
            </span>
          </div>

          {/* Right: progress + reset */}
          <div className="flex items-center gap-4">
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${(requiredCompleted / REQUIRED_STEPS) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  style={{
                    background: allSelected
                      ? "linear-gradient(90deg, #10b981, #34d399)"
                      : "linear-gradient(90deg, #06b6d4, #3b82f6)",
                  }}
                />
              </div>
              <span className="text-xs font-mono text-gray-500">
                {Math.round((requiredCompleted / REQUIRED_STEPS) * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
            {completedCount > 0 && (
              <button
                onClick={() => setShowAudit(true)}
                className="py-1.5 px-3 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-all duration-200 active:scale-95"
                style={{
                  background: "rgba(112,0,255,0.15)",
                  border:     "1px solid rgba(112,0,255,0.4)",
                  color:      "#b060ff",
                  boxShadow:  "0 0 12px rgba(112,0,255,0.2)",
                }}
              >
                <Sparkles size={12} /> Auditoría IA
              </button>
            )}
            {allSelected && (
              <>
                <button
                  onClick={() => setShowBudget(true)}
                  className="btn-neon py-1.5 text-xs"
                >
                  <FileText size={12} /> Generar Presupuesto
                </button>
                <button
                  onClick={() => router.push("/checkout")}
                  className="btn-ghost py-1.5 text-xs"
                >
                  <ShoppingCart size={12} /> Checkout
                </button>
                <button
                  onClick={() => router.push(session ? "/pc-builder" : "/login")}
                  className="btn-ghost py-1.5 text-xs"
                  title={session ? "Guardar build" : "Login para guardar"}
                >
                  <Save size={12} /> {session ? "Guardar" : "Login"}
                </button>
              </>
            )}
            {completedCount > 0 && (
              <button onClick={reset} className="btn-ghost py-1.5 text-xs">
                <RotateCcw size={12} /> Reiniciar
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mt-4 pt-4 border-t border-gray-800/60">
          <StepIndicator
            steps={BUILD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={setStep}
          />
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Product selection (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-5">

            {/* Step info */}
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="badge-cyan text-[10px]">
                    PASO {currentStep + 1}/{BUILD_STEPS.length}
                  </span>
                  <h2 className="text-sm font-semibold text-white">
                    {BUILD_STEPS[currentStep]?.description}
                  </h2>
                </div>
                {!loadingProducts && products.length > 0 && (
                  <p className="text-[11px] text-gray-600 font-mono">
                    {activeFilters
                      ? `${filteredProducts.length} de ${products.length} componentes`
                      : `${products.length} componente${products.length !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
            </div>

            {/* ── Barra de búsqueda + filtros ──────────────────────────────── */}
            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder={`Buscar ${BUILD_STEPS[currentStep]?.description ?? ""}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg pl-8 pr-8 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Toggle filtro precio */}
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={cn(
                    "p-2 rounded-lg border text-xs transition-colors",
                    showFilters || minPrice || maxPrice
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-400"
                      : "border-gray-700/50 bg-gray-900/60 text-gray-500 hover:text-gray-300"
                  )}
                  title="Filtrar por precio"
                >
                  <SlidersHorizontal size={13} />
                </button>
              </div>

              {/* Filtro de precio (expandible) */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">USD</span>
                      <input
                        type="number"
                        placeholder="Mín"
                        min={0}
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                      />
                      <span className="text-[10px] text-gray-600">—</span>
                      <input
                        type="number"
                        placeholder="Máx"
                        min={0}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors"
                      />
                      {(minPrice || maxPrice) && (
                        <button
                          onClick={() => { setMinPrice(""); setMaxPrice(""); }}
                          className="text-gray-500 hover:text-gray-300 shrink-0"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Product grid with AnimatePresence for step transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={category}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {productsError ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 text-sm text-red-400 space-y-1">
                    <p className="font-semibold">Error al cargar productos</p>
                    <p className="text-xs text-gray-500">
                      {productsError instanceof Error ? productsError.message : "Error desconocido"}
                    </p>
                  </div>
                ) : loadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ProductCardSkeleton />
                    <ProductCardSkeleton />
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-14 space-y-2">
                    <p className="text-3xl">{activeFilters ? "🔍" : "📭"}</p>
                    <p className="text-sm text-gray-500 font-medium">
                      {activeFilters ? "Sin resultados para esa búsqueda" : "Sin productos disponibles"}
                    </p>
                    {activeFilters ? (
                      <button
                        onClick={() => { setSearchQuery(""); setMinPrice(""); setMaxPrice(""); }}
                        className="text-xs text-cyan-600 hover:text-cyan-400 font-mono"
                      >
                        Limpiar filtros
                      </button>
                    ) : (
                      <p className="text-xs text-gray-600 font-mono">
                        Ejecuta <code className="text-cyan-700">npm run seed</code> en capa-negocio
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProducts.map((product, idx) => {
                      const isSel = selected[product.category]?.id === product.id;
                      const glowState = isSel
                        ? validation?.compatible === true  ? "compatible"
                        : validation?.compatible === false ? "incompatible"
                        : null
                        : null;
                      return (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isSelected={isSel}
                          onSelect={handleSelect}
                          animIndex={idx}
                          glowState={glowState}
                        />
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800/60">
              <button
                onClick={() => setStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="btn-glass disabled:opacity-30 disabled:cursor-not-allowed text-xs"
              >
                <ChevronLeft size={14} /> Anterior
              </button>

              {currentStep < BUILD_STEPS.length - 1 ? (
                <button onClick={() => setStep(currentStep + 1)} className="btn-glass text-xs">
                  Siguiente <ChevronRight size={14} />
                </button>
              ) : allSelected ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-emerald-400 font-mono flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  BUILD COMPLETO
                </motion.span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right: Build Manifest (1/3) */}
        <div>
          <BuildManifest
            steps={BUILD_STEPS}
            selected={selected}
            totalPrice={totalPrice}
            totalTdp={totalTdp}
            onRemove={removeComponent}
            validation={validation ?? null}
            isValidating={isValidating}
            validationError={validationError instanceof Error ? validationError : null}
          />
        </div>
      </div>

      {/* AI Audit modal */}
      <AIAuditModal
        isOpen={showAudit}
        onClose={() => setShowAudit(false)}
        components={selectedList}
        totalPrice={totalPrice}
        totalTdp={totalTdp}
      />

      {/* Budget modal */}
      <BudgetModal
        isOpen={showBudget}
        onClose={() => setShowBudget(false)}
        steps={BUILD_STEPS}
        selected={selected}
        totalPrice={totalPrice}
        totalTdp={totalTdp}
        validation={validation ?? null}
        isValidating={isValidating}
      />
    </main>
  );
}
