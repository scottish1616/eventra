"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";

export default function EventPreviewModal({ open, onClose, event }: { open: boolean; onClose: () => void; event?: any }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // focus
    const prev = document.activeElement as HTMLElement | null;
    rootRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [open, onClose]);

  if (!open || !event) return null;

  const minPrice = (event.ticketTypes && event.ticketTypes.length > 0)
    ? Math.min(...event.ticketTypes.map((t: any) => t.price))
    : 0;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22 }}
        className="glass-card max-w-3xl w-full mx-4 p-6 z-50 outline-none"
        role="dialog"
        aria-modal="true"
        aria-label={event.title || "Event preview"}
        tabIndex={-1}
        ref={rootRef}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h3 className="text-xl font-semibold text-white">{event.title}</h3>
            <p className="text-sm text-white/70 mt-1">{event.location} • {event.date ? new Date(event.date).toLocaleDateString() : ""}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/70" aria-label="Close preview">
            <X />
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            {event.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.image} alt={event.title} className="h-40 md:h-56 w-full object-cover rounded-lg" />
            ) : (
              <div className="h-40 md:h-56 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center text-4xl">🎟️</div>
            )}
            <div className="mt-3 text-sm text-white/70">From {minPrice > 0 ? new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',minimumFractionDigits:0}).format(minPrice) : '—'}</div>
          </div>

          <div className="md:col-span-2 text-white/80">
            <div className="max-h-48 overflow-auto pr-2 text-sm leading-relaxed">{event.description || "No description provided."}</div>

            {event.ticketTypes && event.ticketTypes.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-white">Ticket types</h4>
                <div className="grid gap-2">
                  {event.ticketTypes.slice(0,3).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-sm text-white/80 p-2 rounded-md bg-white/3">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-white/60">{t.category}</div>
                      </div>
                      <div className="font-semibold">{new Intl.NumberFormat('en-KE',{style:'currency',currency:'KES',minimumFractionDigits:0}).format(t.price)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={() => {
                  onClose();
                  router.push(`/event/${event.slug}/buy`);
                }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white"
              >
                View & Buy
              </Button>
              <Button onClick={onClose} className="bg-white/6 text-white">Close</Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
