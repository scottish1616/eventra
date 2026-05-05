"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  children: React.ReactNode;
  tabKey: string;
}

export function PageTransition({ children, tabKey }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}