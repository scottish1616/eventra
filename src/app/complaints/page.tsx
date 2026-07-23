"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ComplaintForm } from "@/components/shared/ComplaintForm";
import { MessageSquare } from "lucide-react";

function ComplaintsContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? undefined;
  const organizerId = searchParams.get("organizerId") ?? undefined;
  const eventName = searchParams.get("eventName") ?? undefined;
  const organizerName = searchParams.get("organizerName") ?? undefined;

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8 text-white">
          <div className="rounded-2xl bg-purple-600/10 p-3 text-purple-300">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-purple-300/70">
              Support
            </p>
            <h1 className="text-3xl font-bold text-white">
              Submit a complaint
            </h1>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-sm text-gray-300">
            <p className="mb-3 font-semibold text-white">How this works</p>
            <ul className="space-y-2">
              <li>• Attendees submit issues directly to the organizer.</li>
              <li>• Organizers can manage complaints in their dashboard.</li>
              <li>
                • If needed, organizers can escalate issues to the admin team.
              </li>
              <li>
                • The admin sees escalated complaints in the admin complaints
                center.
              </li>
            </ul>
          </div>

          <ComplaintForm
            eventId={eventId}
            organizerId={organizerId}
            eventName={eventName}
            organizerName={organizerName}
          />

          <div className="flex items-center justify-between rounded-3xl border border-gray-800 bg-gray-900 p-5 text-sm text-gray-400">
            <p>
              If you want to track escalated complaints, organizers and admins
              can use their dashboard complaint centers.
            </p>
            <Link
              href="/dashboard/organizer"
              className="text-purple-300 hover:text-white text-sm font-semibold"
            >
              Organizer dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComplaintsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ComplaintsContent />
    </Suspense>
  );
}
