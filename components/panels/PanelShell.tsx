"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const PanelShell = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.section
    initial={{ opacity: 0, x: -12 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    className={cn(
      "flex w-80 shrink-0 flex-col border-l border-t border-border bg-card text-muted-foreground sticky left-14 h-full max-sm:hidden select-none overflow-y-auto pb-20 shadow-panel",
      className
    )}
  >
    {children}
  </motion.section>
);

export default PanelShell;
