"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
  Upload, X, Plus, Minus,
  Calendar, MapPin, Ticket,
  Image as ImageIcon, ArrowLeft
} from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

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

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Banner image must be under 5MB");
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadBanner = async (): Promise<string | null> => {
    if (!bannerFile) return null;
    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("file", bannerFile);

      const res = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        console.error("[Banner Upload] Failed:", json.error);
        toast.error(`Banner upload failed: ${json.error}. Event will be created without banner.`);
        return null;
      }

      return json.url as string;
    } catch (err) {
      console.error("[Banner Upload] Exception:", err);
      toast.error("Banner upload failed. Event will be created without banner.");
      return null;
    } finally {
      setUploadingBanner(false);
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
      
      // Add form fields
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("date", form.date);
      formData.append("endDate", form.endDate);
      formData.append("location", form.location);
      formData.append("venue", form.venue);
      
      // Add ticket types as JSON string
      formData.append("ticketTypes", JSON.stringify(ticketTypes));
      
      // Add banner file if present
      if (bannerFile) {
        formData.append("coverImage", bannerFile);
      }

      const res = await fetch("/api/events", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to create event");
        setLoading(false);
        return;
      }

      toast.success("Event created successfully!");
      router.push("/dashboard/organizer");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const categoryColors: Record<string, string> = {
    REGULAR: "border-blue-500/30 bg-blue-500/5",
    VIP: "border-amber-500/30 bg-amber-500/5",
    VVIP: "border-purple-500/30 bg-purple-500/5",
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", borderRadius: "12px" },
      }} />
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-white">EVENTRA</span>
        </div>
        <span className="text-sm text-gray-400">{session?.user?.name}</span>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/dashboard/organizer"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <span className="text-gray-700">/</span>
          <h1 className="text-lg font-bold text-white">Create new event</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Banner upload */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Event banner
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                This will appear on your ticket and event page
              </p>
            </div>

            <div className="p-6">
              {bannerPreview ? (
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <button
                    type="button"
                    onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                    className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-green-500/80 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Banner selected
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-48 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
                >
                  <div className="w-14 h-14 bg-gray-800 group-hover:bg-purple-500/20 rounded-2xl flex items-center justify-center mb-3 transition-all">
                    <Upload className="w-7 h-7 text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <p className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
                    Click to upload event banner
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    PNG, JPG up to 5MB · Recommended 1200×600px
                  </p>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Event details */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <h2 className="font-bold text-white mb-5 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              Event details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Event title *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. AfroBeats Live Concert"
                  required
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Describe your event..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    Start date and time *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-purple-500 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    End date and time
                  </label>
                  <input
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white focus:outline-none focus:border-purple-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    City / Location *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-gray-600 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="e.g. Nairobi, Kenya"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-2">
                    Venue name
                  </label>
                  <input
                    value={form.venue}
                    onChange={(e) => setForm({ ...form, venue: e.target.value })}
                    placeholder="e.g. KICC, Uhuru Park"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ticket types */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Ticket className="w-4 h-4 text-purple-400" />
                Ticket types
              </h2>
              <button
                type="button"
                onClick={addTicketType}
                className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold hover:text-purple-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add ticket type
              </button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((tt, index) => (
                <div
                  key={index}
                  className={`border-2 rounded-2xl p-5 transition-all ${categoryColors[tt.category]}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={tt.category}
                        onChange={(e) =>
                          updateTicketType(
                            index,
                            "category",
                            e.target.value as "REGULAR" | "VIP" | "VVIP"
                          )
                        }
                        className="text-sm font-bold bg-transparent border-none focus:outline-none text-white cursor-pointer"
                      >
                        <option value="REGULAR" className="bg-gray-900">Regular</option>
                        <option value="VIP" className="bg-gray-900">VIP</option>
                        <option value="VVIP" className="bg-gray-900">VVIP</option>
                      </select>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        tt.category === "VVIP"
                          ? "bg-purple-500/20 text-purple-400"
                          : tt.category === "VIP"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {tt.category}
                      </span>
                    </div>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(index)}
                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Ticket name
                      </label>
                      <input
                        value={tt.name}
                        onChange={(e) => updateTicketType(index, "name", e.target.value)}
                        placeholder="e.g. General, Early Bird"
                        required
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Price (KES)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tt.price}
                        onChange={(e) =>
                          updateTicketType(index, "price", parseFloat(e.target.value) || 0)
                        }
                        placeholder="2500"
                        required
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Total slots
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tt.totalSlots}
                        onChange={(e) =>
                          updateTicketType(index, "totalSlots", parseInt(e.target.value) || 1)
                        }
                        required
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        Max per order
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={tt.maxPerOrder}
                        onChange={(e) =>
                          updateTicketType(index, "maxPerOrder", parseInt(e.target.value) || 10)
                        }
                        className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                      Description (optional)
                    </label>
                    <input
                      value={tt.description}
                      onChange={(e) => updateTicketType(index, "description", e.target.value)}
                      placeholder="What is included with this ticket?"
                      className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard/organizer"
              className="flex-1 text-center py-4 border border-gray-700 text-gray-300 rounded-2xl text-sm font-semibold hover:bg-gray-800 transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingBanner}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl text-sm font-bold hover:opacity-90 transition disabled:opacity-60 shadow-lg shadow-purple-500/20"
            >
              {loading || uploadingBanner ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {uploadingBanner
                ? "Uploading banner..."
                : loading
                ? "Creating event..."
                : "Create event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}