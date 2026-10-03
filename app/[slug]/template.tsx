"use client";

import { motion } from "motion/react";

// Troca de tela: entra subindo um pouco, sem atrasar a navegação.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      // ao terminar tira o filter: ele prenderia barras fixas e o vidro dentro deste bloco
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none", transform: "none" } }}
      transition={{ type: "spring", duration: 0.35, bounce: 0 }}
    >
      {children}
    </motion.div>
  );
}
