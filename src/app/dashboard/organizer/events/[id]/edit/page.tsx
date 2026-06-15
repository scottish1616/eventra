"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Upload } from "lucide-react";

interface TicketTypeForm {
  id?: string;
  category: "REGULAR" | "VIP" | "VVIP";
  name: string;
  description: string;
  price: number;
  totalSlots: number;
  maxPerOrder: number;
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { data: session, status } = useSession();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    venue: "",
    coverImageFile: null as File | null,
    existingCoverImage: null as string | null,
  });

  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      fetchEvent();
    }
  }, [status, eventId]);

  const fetchEvent = async () => {
    if (!eventId) {
      const errorMsg = "Invalid event ID.";
      console.error("Event fetch error:", errorMsg);
      setError(errorMsg);
      setFetching(false);
      return;
    }

    try {
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json?.error || res.statusText || "Event not found";
        console.error("Event fetch error:", errorMsg);
        setError(errorMsg);
        setFetching(false);
        return;
      }

      const event = json.data;
      setForm({
        title: event.title || "",
        description: event.description || "",
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
        endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
        location: event.location || "",
        venue: event.venue || "",
        coverImageFile: null,
        existingCoverImage: event.coverImage || null,
      });

      if (event.coverImage) {
        setImagePreview(event.coverImage);
      }

      setTicketTypes(event.ticketTypes || []);
      setFetching(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load event. Please try again.");
      setFetching(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm({ ...form, coverImageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("endDate", form.endDate);
      formData.append("location", form.location);
      formData.append("venue", form.venue);
      if (form.coverImageFile) {
        formData.append("coverImage", form.coverImageFile);
      }
      formData.append("ticketTypes", JSON.stringify(ticketTypes));

      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}`, {
        method: "PUT",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const errorMsg = json?.error || res.statusText || "Failed to update event";
        console.error("Event update error:", errorMsg);
        setError(errorMsg);
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

  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
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
        <span className="text-sm text-gray-700 font-medium">{session?.user?.name}</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/organizer"
            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            ← Dashboard
          </Link>
          <span className="text-gray-400">/</span>
          <h1 className="text-xl font-bold text-gray-900">Edit event</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Event details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Event title
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Nairobi Tech Summit 2025"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder="Tell attendees what your event is about..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    Start date and time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    required
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">
                    End date and time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  City or location
                </label>
                <input
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="e.g. Nairobi, Kenya"
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Venue name
                </label>
                <input
                  value={form.venue}
                  onChange={(e) =>
                    setForm({ ...form, venue: e.target.value })
                  }
                  placeholder="e.g. KICC, Kenyatta International Convention Centre"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5">
                  Event cover image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-40 w-full object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm font-semibold text-gray-900">
                        {form.coverImageFile?.name || "Current image"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, coverImageFile: null });
                          setImagePreview(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Upload event image
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          PNG, JPG or GIF (max. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket types */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Ticket types</h2>
              <button
                type="button"
                onClick={addTicketType}
                className="text-sm text-violet-600 font-bold hover:text-violet-700"
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
                      className="text-sm font-bold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="VVIP">VVIP</option>
                    </select>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(index)}
                        className="text-xs text-red-600 font-medium hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
                        Ticket name
                      </label>
                      <input
                        value={tt.name || ""}
                        onChange={(e) =>
                          updateTicketType(index, "name", e.target.value)
                        }
                        placeholder="e.g. Early Bird"
                        required
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-900 mb-1">
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
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-bold text-gray-900 mb-1">
                      Description (optional)
                    </label>
                    <input
                      value={tt.description || ""}
                      onChange={(e) =>
                        updateTicketType(index, "description", e.target.value)
                      }
                      placeholder="What is included with this ticket?"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
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
              className="flex-1 text-center py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
