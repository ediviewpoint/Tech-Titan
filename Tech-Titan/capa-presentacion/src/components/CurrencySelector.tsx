"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DollarSign, ChevronDown, RefreshCw, Receipt, X } from "lucide-react";
import {
  useCurrencyStore,
  getEffectiveRate,
  formatPrice,
} from "@/store/currency";
import { fetchCurrencies } from "@/lib/api";
import { CURRENCY_LABELS, type CurrencyCode } from "@/types/hardware";

const CURRENCIES: CurrencyCode[] = ["USD", "PEN", "ARS", "CLP", "COP", "BRL", "MXN"];

export function CurrencySelector() {
  const [open,     setOpen]     = useState(false);
  const [editing,  setEditing]  = useState<CurrencyCode | null>(null);
  const [draftRate, setDraftRate] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const store         = useCurrencyStore();
  const { selectedCurrency, showWithTax, taxRate } = store;
  const effectiveRate = getEffectiveRate(store);

  // Carga tipos de cambio de la API al montar
  useEffect(() => {
    fetchCurrencies().then((rates) => {
      if (rates.length > 0) store.loadApiRates(rates);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar panel al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setEditing(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function startEdit(code: CurrencyCode) {
    setEditing(code);
    setDraftRate(String(getEffectiveRate(store, code)));
  }

  function commitEdit() {
    if (!editing) return;
    const val = parseFloat(draftRate);
    if (!isNaN(val) && val > 0) {
      store.setCustomRate(editing, val);
    }
    setEditing(null);
  }

  const examplePrice = formatPrice(store, 100);

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-500/40 transition-all"
      >
        <DollarSign size={11} className="text-cyan-400" />
        <span>{selectedCurrency}</span>
        {showWithTax && <span className="text-[9px] text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-1">+IGV</span>}
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 z-50 rounded-xl border border-cyan-500/20 bg-gray-950/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest">Moneda &amp; Tipo de Cambio</span>
              <button onClick={() => setOpen(false)} className="text-gray-600 hover:text-gray-400">
                <X size={13} />
              </button>
            </div>

            {/* Currency list */}
            <div className="max-h-52 overflow-y-auto p-2 space-y-0.5">
              {CURRENCIES.map((code) => {
                const rate     = getEffectiveRate(store, code);
                const isCustom = code in store.customRates;
                const isActive = code === selectedCurrency;

                return (
                  <div
                    key={code}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isActive
                        ? "bg-cyan-500/10 border border-cyan-500/25"
                        : "hover:bg-gray-800/50 border border-transparent"
                    }`}
                    onClick={() => {
                      store.setCurrency(code);
                      setEditing(null);
                    }}
                  >
                    <span className={`text-xs font-mono flex-1 ${isActive ? "text-cyan-300" : "text-gray-400"}`}>
                      {CURRENCY_LABELS[code]}
                    </span>

                    {editing === code ? (
                      <input
                        autoFocus
                        className="w-20 bg-gray-900 border border-cyan-500/40 text-cyan-200 text-xs font-mono rounded px-2 py-0.5 text-right focus:outline-none"
                        value={draftRate}
                        onChange={(e) => setDraftRate(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(null); }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded cursor-pointer hover:bg-gray-700 transition-colors ${isCustom ? "text-amber-400" : "text-gray-500"}`}
                        title="Click para editar tipo de cambio"
                        onClick={(e) => { e.stopPropagation(); startEdit(code); }}
                      >
                        {rate.toFixed(code === "CLP" || code === "COP" || code === "ARS" ? 0 : 2)}
                      </span>
                    )}

                    {isCustom && (
                      <button
                        title="Restablecer al valor oficial"
                        className="text-gray-600 hover:text-amber-400 transition-colors"
                        onClick={(e) => { e.stopPropagation(); store.resetRate(code); }}
                      >
                        <RefreshCw size={10} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tax section */}
            <div className="border-t border-gray-800/60 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Receipt size={11} className="text-violet-400" />
                  <span className="text-xs text-gray-400">Con factura (IGV/IVA)</span>
                </div>
                <button
                  onClick={() => store.setShowTax(!showWithTax)}
                  className={`w-9 h-5 rounded-full transition-all relative ${showWithTax ? "bg-violet-600" : "bg-gray-700"}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${showWithTax ? "left-4" : "left-0.5"}`} />
                </button>
              </div>

              {showWithTax && (
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-500 font-mono">Tasa impositiva</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      value={taxRate}
                      onChange={(e) => store.setTaxRate(Number(e.target.value))}
                      className="w-14 bg-gray-900 border border-gray-700 text-cyan-200 text-xs font-mono rounded px-2 py-0.5 text-right focus:outline-none focus:border-cyan-500/40"
                    />
                    <span className="text-[11px] text-gray-500">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer: example price */}
            <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-800/40">
              <p className="text-[10px] text-gray-500 font-mono">
                Ejemplo: $100 USD = <span className="text-cyan-400">{examplePrice}</span>
                {showWithTax && <span className="text-violet-400 ml-1">(+{taxRate}% IGV)</span>}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                1 USD = {effectiveRate.toFixed(selectedCurrency === "CLP" || selectedCurrency === "COP" || selectedCurrency === "ARS" ? 0 : 2)} {selectedCurrency}
                {selectedCurrency in store.customRates && (
                  <span className="text-amber-500 ml-1">(editado)</span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
