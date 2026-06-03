"use client";

import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Variant = "glass" | "neumorph" | "clay";

export function Card({
  children,
  variant = "glass",
  as: Component = "div",
  className = "",
  ...props
}: React.PropsWithChildren<{
  variant?: Variant;
  as?: React.ElementType;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"div">, "className">>) {
  const base = variant === "neumorph" ? "card-neu" : variant === "clay" ? "card-clay" : "glass-card";

  const motionProps = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    whileHover: { y: -6, scale: 1.01 },
    transition: { duration: 0.32, ease: "easeOut" as const },
    className: `${base} ${className}`,
    ...props,
  } as HTMLMotionProps<"div">;

  if (Component === "div") {
    return (
      <motion.div {...motionProps}>
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div {...motionProps}>
      <Component>
        {children}
      </Component>
    </motion.div>
  );
}

export default Card;
