"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function TicketLookupPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [ticketNumber, setTicketNumber] = useState(
        searchParams.get("number") || ""
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const number = searchParams.get("number");
        if (number) {
            handleLookup(number);
        }
    }, []);

    const handleLookup = async (number?: string) => {
        const lookupNumber = number || ticketNumber;
        if (!lookupNumber.trim()) {
            setError("Please enter your ticket number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(
                `/api/tickets/lookup?number=${lookupNumber.trim()}`
            );
            const json = await res.json();

            if (!json.success || !json.data) {
                setError("Ticket not found. Please check your ticket number.");
                setLoading(false);
                return;
            }

            router.push(`/ticket/view/${json.data.id}`);
        } catch {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-gray-900">
                        <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold">
                            E
                        </div>
                        Eventra
                    </Link>
                    <h1 className="mt-6 text-2xl font-bold text-gray-900">
                        Find your ticket
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Enter your ticket number to view your QR code
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Ticket number
                            </label>
                            <input
                                type="text"
                                value={ticketNumber}
                                onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                                placeholder="e.g. NAI-2025-123456"
                                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleLookup();
                                }}
                            />
                            <p className="mt-1 text-xs text-gray-400">
                                Found on your ticket confirmation
                            </p>
                        </div>

                        <button
                            onClick={() => handleLookup()}
                            disabled={loading}
                            className="w-full bg-violet-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60"
                        >
                            {loading ? "Looking up..." : "View my ticket"}
                        </button>
                    </div>
                </div>

                <p className="mt-5 text-center text-sm text-gray-500">
                    <Link href="/" className="text-violet-600 hover:underline">
                        Browse events
                    </Link>
                </p>
            </div>
        </div>
    );
}