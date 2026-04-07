import { useState, useEffect } from "react";

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  status: string;
  slug: string;
  _count: { tickets: number; orders: number };
  orders: { total: number }[];
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    category: string;
    totalSlots: number;
    soldCount: number;
  }[];
}

export function useEvents(mine = false) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = mine ? "/api/events?mine=true" : "/api/events";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.data || []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [mine]);

  return { events, loading, error };
}
