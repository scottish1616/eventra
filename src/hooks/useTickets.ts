import { useState, useEffect } from "react";

interface Ticket {
  id: string;
  ticketNumber: string;
  isUsed: boolean;
  createdAt: string;
  event: {
    title: string;
    date: string;
    location: string;
  };
  ticketType: {
    name: string;
    price: number;
    category: string;
  };
}

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tickets/my")
      .then((r) => r.json())
      .then((d) => {
        setTickets(d.data || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { tickets, loading, error };
}
