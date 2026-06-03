"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ticket, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";

interface Event {
  id: string;
  title: string;
  organizerId: string;
  date: string;
  location: string;
}

interface Organizer {
  id: string;
  name: string;
  organizationName: string | null;
  email: string;
}

export default function NewComplaintPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "OTHER",
    priority: "MEDIUM",
    complainantName: "",
    complainantPhone: "",
    complainantEmail: "",
    eventId: "",
    organizerId: "",
  });

  useEffect(() => {
    fetch("/api/complaints/form-data")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEvents(d.data.events);
          setOrganizers(d.data.organizers);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const selectedOrganizer = organizers.find(
    (o) => o.id === form.organizerId
  ) || null;

  const organizerEvents = form.organizerId
    ? events.filter((e) => e.organizerId === form.organizerId)
    : [];

  const handleOrganizerChange = (organizerId: string) => {
    setSelectedEvent(null);
    setForm((prev) => ({
      ...prev,
      organizerId,
      eventId: "",
    }));
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    setSelectedEvent(event || null);
    setForm((prev) => ({
      ...prev,
      eventId,
      organizerId: event?.organizerId || prev.organizerId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to submit complaint");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-10 text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Complaint submitted
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            Your complaint has been sent to the event organizer. They will review it and respond as soon as possible. If the issue is not resolved, it will be escalated to admin.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-blue-700 mb-2">What happens next?</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>1. Organizer receives your complaint</li>
              <li>2. Organizer reviews and responds</li>
              <li>3. If unresolved, escalated to admin</li>
              <li>4. Admin resolves the issue finally</li>
            </ul>
          </div>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-bold text-gray-900">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
            <Ticket className="w-4 h-4 text-white" />
          </div>
          Eventra
        </Link>
        <Link href="/" className="text-sm text-gray-500 hover:text-purple-600">
          ← Back to events
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Submit a complaint</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your complaint goes directly to the event organizer. If not resolved, it is escalated to admin.
          </p>
        </div>

        {/* Flow indicator */}
        <div className="flex items-center gap-2 mb-8 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          {[
            { label: "You", sub: "Submit complaint", color: "bg-purple-600" },
            { label: "Organizer", sub: "Reviews & responds", color: "bg-blue-500" },
            { label: "Admin", sub: "Escalation (if needed)", color: "bg-red-500" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 flex-1">
              <div className="text-center flex-1">
                <div className={`w-8 h-8 rounded-full ${step.color} text-white text-xs font-bold flex items-center justify-center mx-auto mb-1 shadow-md`}>
                  {i + 1}
                </div>
                <p className="text-xs font-bold text-gray-700">{step.label}</p>
                <p className="text-xs text-gray-400">{step.sub}</p>
              </div>
              {i < 2 && (
                <div className="text-gray-300 text-lg flex-shrink-0">→</div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {error && (
            <div className="mb-5 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Your details */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Your details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Full name *
                  </label>
                  <input
                    type="text"
                    value={form.complainantName}
                    onChange={(e) => setForm({ ...form, complainantName: e.target.value })}
                    placeholder="John Kamau"
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    value={form.complainantPhone}
                    onChange={(e) => setForm({ ...form, complainantPhone: e.target.value })}
                    placeholder="0712 345 678"
                    required
                    className="input-field"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={form.complainantEmail}
                  onChange={(e) => setForm({ ...form, complainantEmail: e.target.value })}
                  placeholder="john@email.com"
                  className="input-field"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Event details</h3>

              {/* Organizer selection */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Select the organizer *
                </label>
                {loading ? (
                  <div className="input-field animate-pulse bg-gray-100" />
                ) : (
                  <div className="relative">
                    <select
                      value={form.organizerId}
                      onChange={(e) => handleOrganizerChange(e.target.value)}
                      required
                      className="input-field appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">Choose organizer...</option>
                      {organizers.map((organizer) => (
                        <option key={organizer.id} value={organizer.id}>
                          {organizer.organizationName || organizer.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Event selection filtered by organizer */}
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Select the event *
                </label>
                {loading ? (
                  <div className="input-field animate-pulse bg-gray-100" />
                ) : (
                  <div className="relative">
                    <select
                      value={form.eventId}
                      onChange={(e) => handleEventChange(e.target.value)}
                      required
                      disabled={!form.organizerId}
                      className="input-field appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">
                        {form.organizerId
                          ? "Choose an event from this organizer..."
                          : "Select an organizer first..."}
                      </option>
                      {organizerEvents.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title} — {new Date(event.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                )}
                {form.organizerId && organizerEvents.length === 0 && !loading && (
                  <p className="text-xs text-gray-400 mt-2">
                    No events found for this organizer.
                  </p>
                )}
              </div>

              {/* Auto-filled organizer */}
              {selectedEvent && selectedOrganizer && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Organizer selected
                  </label>
                  <div className="input-field bg-gray-50 text-gray-500 flex items-center gap-2">
                    {`${selectedOrganizer.organizationName || selectedOrganizer.name} (${selectedOrganizer.email})`}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Your complaint will go directly to this organizer.
                  </p>
                </div>
              )}

              {!selectedEvent && form.organizerId && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-700">
                    Please select an event from the chosen organizer.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Complaint details</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="input-field appearance-none pr-10 cursor-pointer"
                    >
                      <option value="PAYMENT">Payment issue</option>
                      <option value="TICKET">Ticket problem</option>
                      <option value="EVENT_ISSUE">Event issue</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Priority
                  </label>
                  <div className="relative">
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="input-field appearance-none pr-10 cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High — urgent</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Complaint title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Brief summary of your issue"
                  required
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Describe your issue *
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what happened in detail. Include any reference numbers, transaction IDs or ticket numbers..."
                  required
                  rows={5}
                  className="input-field resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !form.eventId || !form.organizerId}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {submitting ? "Submitting..." : "Submit complaint to organizer"}
            </button>

            <p className="text-center text-xs text-gray-400">
              Your complaint goes to the organizer first. If not resolved, admin steps in.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}