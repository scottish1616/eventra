"use client";

import React from "react";
import { motion } from "framer-motion";

type Variant = "glass" | "neumorph" | "clay";

export function Card({
  children,
  variant = "glass",
  as: Component = "div",
  className = "",
  ...props
}: React.PropsWithChildren<{
  variant?: Variant;
  as?: any;
  className?: string;
} & React.HTMLAttributes<HTMLElement>>) {
  const base = variant === "neumorph" ? "card-neu" : variant === "clay" ? "card-clay" : "glass-card";

  return (
    <motion.div
      as={Component}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className={`${base} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default Card;
