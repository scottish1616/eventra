"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Smartphone } from "lucide-react";

export default function MpesaPendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const [status, setStatus] = useState<"pending" | "confirmed" | "failed" | "timeout">("pending");
  const [tickets, setTickets] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/mpesa/status?orderId=${orderId}`);
        const json = await res.json();

        if (json.status === "CONFIRMED") {
          setStatus("confirmed");
          setTickets(json.tickets || []);
          clearInterval(interval);
          return;
        }

        if (json.status === "CANCELLED" || json.status === "FAILED") {
          setStatus("failed");
          clearInterval(interval);
          return;
        }

        setAttempts((prev) => {
          if (prev >= 20) {
            setStatus("timeout");
            clearInterval(interval);
          }
          return prev + 1;
        });
      } catch {
        console.error("Polling error");
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">

          {status === "pending" && (
            <>
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Smartphone className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Check your phone
              </h1>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                An M-Pesa STK push has been sent to your phone. Enter your M-Pesa PIN to complete payment.
              </p>
              <div className="flex items-center justify-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
                <Clock className="w-5 h-5 text-green-600 flex-shrink-0 animate-spin" />
                <p className="text-sm text-green-700 font-medium">
                  Waiting for payment confirmation...
                </p>
              </div>
              <div className="flex gap-1 justify-center">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Do not close this page · Attempt {attempts + 1}/20
              </p>
            </>
          )}

          {status === "confirmed" && (
            <>
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Payment confirmed!
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Your M-Pesa payment was successful. Your tickets are ready.
              </p>
              {tickets.length > 0 && (
                <div className="space-y-2 mb-6">
                  {tickets.map((ticketId, i) => (
                    <Link
                      key={ticketId}
                      href={`/ticket/view/${ticketId}`}
                      className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:border-purple-200 transition"
                    >
                      <span className="text-sm font-semibold text-gray-700">
                        Ticket {i + 1}
                      </span>
                      <span className="text-xs text-purple-600 font-semibold">
                        View →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Browse more events
              </Link>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Payment failed
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                Your M-Pesa payment was not completed. Please try again.
              </p>
              <button
                onClick={() => router.back()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition"
              >
                Try again
              </button>
            </>
          )}

          {status === "timeout" && (
            <>
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Clock className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Taking too long
              </h1>
              <p className="text-gray-500 text-sm mb-6">
                We could not confirm your payment. If you entered your PIN, your tickets will be sent once M-Pesa confirms.
              </p>
              <Link
                href="/ticket/lookup"
                className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition text-center mb-3"
              >
                Look up my ticket
              </Link>
              <button
                onClick={() => router.back()}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}