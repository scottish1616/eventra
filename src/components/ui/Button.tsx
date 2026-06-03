"use client";

import { motion } from "framer-motion";
import React from "react";

export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export default Button;
