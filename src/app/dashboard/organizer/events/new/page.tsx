"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface TicketTypeForm {
  category: "REGULAR" | "VIP" | "VVIP";
  name: string;
  description: string;
  price: number;
  totalSlots: number;
  maxPerOrder: number;
}

export default function NewEventPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    venue: "",
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([
    {
      category: "REGULAR",
      name: "Regular",
      description: "",
      price: 0,
      totalSlots: 100,
      maxPerOrder: 10,
    },
  ]);

  const addTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      {
        category: "REGULAR",
        name: "",
        description: "",
        price: 0,
        totalSlots: 100,
        maxPerOrder: 10,
      },
    ]);
  };

  const removeTicketType = (index: number) => {
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicketType = (
    index: number,
    field: keyof TicketTypeForm,
    value: string | number
  ) => {
    setTicketTypes((prev) =>
      prev.map((tt, i) => (i === index ? { ...tt, [field]: value } : tt))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (ticketTypes.length === 0) {
      setError("Add at least one ticket type");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ticketTypes,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to create event");
        setLoading(false);
        return;
      }

      router.push("/dashboard/organizer");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const categoryColors: Record<string, string> = {
    REGULAR: "border-blue-200 bg-blue-50",
    VIP: "border-amber-200 bg-amber-50",
    VVIP: "border-violet-200 bg-violet-50",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-gray-900"
        >
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
            E
          </div>
          Eventra
        </Link>
        <span className="text-sm text-gray-600">{session?.user?.name}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/organizer"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">Create new event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Event details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Nairobi Tech Summit 2025"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Tell attendees what your event is about..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Start date and time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    End date and time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  City or location
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Nairobi, Kenya"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Venue name
                </label>
                <input
                  value={form.venue}
                  onChange={(e) =>
                    setForm({ ...form, venue: e.target.value })
                  }
                  placeholder="e.g. KICC, Kenyatta International Convention Centre"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Ticket types */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ticket types</h2>
              <button
                type="button"
                onClick={addTicketType}
                className="text-sm text-violet-600 font-medium hover:text-violet-700"
              >
                + Add ticket type
              </button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((tt, index) => (
                <div
                  key={index}
                  className={`border rounded-xl p-4 ${categoryColors[tt.category]}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <select
                      value={tt.category}
                      onChange={(e) =>
                        updateTicketType(
                          index,
                          "category",
                          e.target.value as "REGULAR" | "VIP" | "VVIP"
                        )
                      }
                      className="text-sm font-semibold bg-transparent border-none focus:outline-none cursor-pointer"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="VVIP">VVIP</option>
                    </select>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(index)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Ticket name
                      </label>
                      <input
                        value={tt.name}
                        onChange={(e) =>
                          updateTicketType(index, "name", e.target.value)
                        }
                        placeholder="e.g. Early Bird"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Price (KES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tt.price}
                        onChange={(e) =>
                          updateTicketType(
                            index,
                            "price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="2500"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Total slots
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tt.totalSlots}
                        onChange={(e) =>
                          updateTicketType(
                            index,
                            "totalSlots",
                            parseInt(e.target.value) || 1
                          )
                        }
                        placeholder="100"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Max per order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tt.maxPerOrder}
                        onChange={(e) =>
                          updateTicketType(
                            index,
                            "maxPerOrder",
                            parseInt(e.target.value) || 10
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Description (optional)
                    </label>
                    <input
                      value={tt.description}
                      onChange={(e) =>
                        updateTicketType(index, "description", e.target.value)
                      }
                      placeholder="What is included with this ticket?"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard/organizer"
              className="flex-1 text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}