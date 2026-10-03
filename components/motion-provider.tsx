"use client";

import { MotionConfig } from "motion/react";

// Toda animação do motion respeita "reduzir movimento" do aparelho:
// transform e layout viram instantâneos, opacidade continua suave.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", duration: 0.4, bounce: 0 }}>
      {children}
    </MotionConfig>
  );
}
