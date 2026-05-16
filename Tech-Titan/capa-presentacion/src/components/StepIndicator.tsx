"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BuildStep {
  readonly index:       number;
  readonly label:       string;
  readonly description: string;
}

interface StepIndicatorProps {
  steps:          readonly BuildStep[];
  currentStep:    number;
  completedSteps: ReadonlySet<number>;
  onStepClick:    (index: number) => void;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const isActive    = currentStep === i;
        const isCompleted = completedSteps.has(i);
        const isClickable = isCompleted || i <= currentStep;

        return (
          <div key={step.index} className="flex items-center">
            <motion.button
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              whileHover={isClickable ? { scale: 1.04 } : {}}
              whileTap={isClickable ? { scale: 0.97 } : {}}
              className={cn(
                "relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300",
                isActive
                  ? "text-gray-950 cursor-default"
                  : isCompleted
                  ? "text-cyan-400 cursor-pointer"
                  : "text-gray-600 cursor-not-allowed"
              )}
              style={
                isActive
                  ? {
                      background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                      boxShadow: "0 0 20px rgba(6,182,212,0.4), 0 0 40px rgba(6,182,212,0.15)",
                    }
                  : isCompleted
                  ? {
                      background: "rgba(6,182,212,0.1)",
                      border: "1px solid rgba(6,182,212,0.35)",
                    }
                  : {
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }
              }
            >
              {/* Step number / check */}
              <span className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
                isActive ? "bg-black/20" : isCompleted ? "bg-cyan-500/20" : "bg-gray-700/60"
              )}>
                {isCompleted
                  ? <Check size={10} />
                  : <span>{i + 1}</span>
                }
              </span>
              <span className="hidden sm:block">{step.label}</span>

              {/* Active pulse ring */}
              {isActive && (
                <motion.span
                  className="absolute inset-0 rounded-full border border-cyan-400/40"
                  animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.button>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <motion.div
                className="h-px mx-1"
                style={{ width: "2.5rem" }}
                animate={{
                  background: isCompleted
                    ? "linear-gradient(90deg, rgba(6,182,212,0.6), rgba(6,182,212,0.3))"
                    : "rgba(255,255,255,0.06)",
                }}
                transition={{ duration: 0.4 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
