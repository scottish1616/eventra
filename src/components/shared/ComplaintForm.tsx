"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface ComplaintFormProps {
  eventId?: string;
  organizerId?: string;
  eventName?: string;
  organizerName?: string;
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !subject.trim() || !description.trim()) {
      setError("Please fill in your name, subject and description.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: description.trim(),
          complainantName: name.trim(),
          complainantPhone: phone.trim() || null,
          complainantEmail: email.trim() || null,
          eventId: eventId || null,
          organizerId: organizerId || null,
          eventName: eventNameInput.trim() || null,
          organizerName: organizerNameInput.trim() || null,
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
            Event name
            <input
              value={eventNameInput}
              onChange={(e) => setEventNameInput(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
              placeholder="Name of the event"
            />
          </label>
          <label className="block text-xs text-gray-300">
            Organizer name
            <input
              value={organizerNameInput}
              onChange={(e) => setOrganizerNameInput(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
              placeholder="Name of the organizer"
            />
          </label>
        </div>

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
