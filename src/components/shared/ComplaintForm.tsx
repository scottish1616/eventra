"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface ComplaintFormProps {
  eventId?: string;
  organizerId?: string;
  eventName?: string;
  organizerName?: string;
}

interface Organizer {
  id: string;
  name: string;
  organizationName?: string;
  email: string;
}

interface EventData {
  id: string;
  title: string;
  organizerId: string;
  date: string;
  location?: string;
}

const categories = [
  { value: "PAYMENT", label: "Payment Issue" },
  { value: "TICKET", label: "Ticket Problem" },
  { value: "EVENT_ISSUE", label: "Event Issue" },
  { value: "OTHER", label: "Other" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function ComplaintForm({
  eventId,
  organizerId,
  eventName,
  organizerName,
}: ComplaintFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [eventNameInput, setEventNameInput] = useState(eventName || "");
  const [organizerNameInput, setOrganizerNameInput] = useState(organizerName || "");
  const [category, setCategory] = useState("EVENT_ISSUE");
  const [priority, setPriority] = useState("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    eventId: eventId || "",
    organizerId: organizerId || "",
  });

  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const selectedOrganizer = organizers.find(
    (o) => o.id === form.organizerId
  );
  const selectedEvent = events.find((e) => e.id === form.eventId) || null;
  const filteredEvents = form.organizerId
    ? events.filter((e) => e.organizerId === form.organizerId)
    : [];

  useEffect(() => {
    const loadFormData = async () => {
      setLoadingData(true);
      try {
        const res = await fetch("/api/complaints/form-data");
        const data = await res.json();
        if (res.ok && data.success) {
          setOrganizers(data.data.organizers || []);
          setEvents(data.data.events || []);
        }
      } catch (err) {
        console.error("Failed to load complaint form data", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  const handleOrganizerChange = (organizerId: string) => {
    const organizer = organizers.find((o) => o.id === organizerId);
    setForm((prev) => ({
      ...prev,
      organizerId,
      eventId: "",
    }));
    if (organizer) {
      setOrganizerNameInput(
        `${organizer.organizationName || organizer.name}`
      );
    }
  };

  const handleEventChange = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);

    setForm((prev) => ({
      ...prev,
      eventId,
      organizerId: event?.organizerId || prev.organizerId,
    }));
    if (event) {
      setEventNameInput(event.title);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !subject.trim() || !description.trim()) {
      setError("Please fill in your name, subject and description.");
      return;
    }

    setSubmitting(true);

    try {
      const selectedEvent = events.find((e) => e.id === form.eventId);
      const selectedOrganizer = organizers.find(
        (o) => o.id === form.organizerId
      );

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: description.trim(),
          complainantName: name.trim(),
          complainantPhone: phone.trim() || null,
          complainantEmail: email.trim() || null,
          eventId: form.eventId || null,
          organizerId: form.organizerId || null,
          eventName:
            selectedEvent?.title || eventNameInput.trim() || null,
          organizerName:
            selectedOrganizer?.organizationName ||
            selectedOrganizer?.name ||
            organizerNameInput.trim() ||
            null,
          type: "ATTENDEE",
          category,
          priority,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Unable to submit complaint.");
      }

      setSuccess(true);
      setName("");
      setPhone("");
      setEmail("");
      setSubject("");
      setDescription("");
      setCategory("EVENT_ISSUE");
      setPriority("MEDIUM");
      toast.success("Your complaint has been submitted.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send complaint.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-3xl p-8 shadow-xl shadow-black/10 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Report an issue</h1>
        <p className="text-sm text-gray-400 mt-2">
          Submit your attendee issue and it will be routed to the event
          organizer. If the organizer escalates it, the admin will receive it
          for resolution.
        </p>
      </div>

      {(eventName || organizerName) && (
        <div className="space-y-2 mb-6 text-sm text-gray-300">
          {eventName && (
            <p>
              <span className="font-semibold text-white">Event:</span>{" "}
              {eventName}
            </p>
          )}
          {organizerName && (
            <p>
              <span className="font-semibold text-white">Organizer:</span>{" "}
              {organizerName}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-gray-300">
            Your name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
              placeholder="Full name"
            />
          </label>
          <label className="block text-xs text-gray-300">
            Phone number
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
              placeholder="0712 345 678"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-gray-300">
            Email address
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </label>
          <label className="block text-xs text-gray-300">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-gray-300">
            Organizer
            <select
              value={form.organizerId}
              onChange={(e) => handleOrganizerChange(e.target.value)}
              disabled={loadingData}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loadingData ? "Loading organizers..." : "Choose an organizer"}
              </option>
              {organizers.map((organizer) => (
                <option key={organizer.id} value={organizer.id}>
                  {organizer.organizationName || organizer.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-gray-300">
            Event
            <select
              value={form.eventId}
              onChange={(e) => handleEventChange(e.target.value)}
              disabled={loadingData || !form.organizerId}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                {loadingData
                  ? "Loading events..."
                  : form.organizerId
                  ? "Select an event"
                  : "Select an organizer first"}
              </option>
              {filteredEvents.map((eventOption) => (
                <option key={eventOption.id} value={eventOption.id}>
                  {eventOption.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingData && (
          <p className="text-sm text-gray-400 mt-2">
            Loading organizers and events...
          </p>
        )}

        {selectedOrganizer && selectedEvent && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-300">
            <p className="font-semibold text-white">Reporting for</p>
            <p className="mt-2">Organizer: {selectedOrganizer.organizationName || selectedOrganizer.name}</p>
            <p>Event: {selectedEvent.title}</p>
          </div>
        )}

        {!loadingData && !selectedOrganizer && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4 text-sm text-amber-200">
            Select an organizer and event so the complaint is routed correctly.
          </div>
        )}

        <label className="block text-xs text-gray-300">
          Subject
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
            placeholder="What is the issue?"
          />
        </label>

        <label className="block text-xs text-gray-300">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="mt-2 w-full rounded-3xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none resize-none"
            placeholder="Describe the issue in detail..."
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block text-xs text-gray-300">
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              {priorities.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Send complaint"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-green-400">
            Your complaint has been recorded. The organizer will review it
            shortly.
          </p>
        )}
      </form>
    </div>
  );
}
