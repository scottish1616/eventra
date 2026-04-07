"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface TicketType {
  id: string;
  name: string;
  price: number;
  category: string;
  totalSlots: number;
  soldCount: number;
  maxPerOrder: number;
}

interface Event {
  id: string;
  slug: string;
}

interface Props {
  event: Event;
  ticketTypes: TicketType[];
}

export function TicketSelector({ event, ticketTypes }: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const setQty = (id: string, delta: number, max: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [id]: next };
    });
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = ticketTypes.reduce((sum, tt) => {
    return sum + tt.price * (quantities[tt.id] ?? 0);
  }, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const handleCheckout = () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/event/${event.slug}`);
      return;
    }
    const items = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

    const params = new URLSearchParams({
      eventId: event.id,
      items: JSON.stringify(items),
    });

    router.push(`/checkout?${params.toString()}`);
  };

  return (
    <div>
      <div className="space-y-3 mb-4">
        {ticketTypes.map((tt) => {
          const available = tt.totalSlots - tt.soldCount;
          const qty = quantities[tt.id] ?? 0;
          const isSoldOut = available === 0;

          return (
            <div
              key={tt.id}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{tt.name}</p>
                <p className="text-xs text-gray-400">
                  {formatCurrency(tt.price)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setQty(tt.id, -1, Math.min(available, tt.maxPerOrder))
                  }
                  disabled={qty === 0}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  -
                </button>
                <span className="w-5 text-center text-sm font-semibold">
                  {qty}
                </span>
                <button
                  onClick={() =>
                    setQty(tt.id, 1, Math.min(available, tt.maxPerOrder))
                  }
                  disabled={
                    isSoldOut || qty >= Math.min(available, tt.maxPerOrder)
                  }
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalItems > 0 && (
        <div className="flex justify-between items-center mb-4 py-2 border-t border-gray-100">
          <span className="text-sm text-gray-600">
            {totalItems} ticket{totalItems !== 1 ? "s" : ""}
          </span>
          <span className="font-bold text-gray-900">
            {formatCurrency(totalPrice)}
          </span>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={totalItems === 0}
        className="w-full flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {totalItems === 0
          ? "Select tickets"
          : `Buy ${totalItems} ticket${totalItems !== 1 ? "s" : ""}`}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">
        Secure payment via M-Pesa or card
      </p>
    </div>
  );
}
