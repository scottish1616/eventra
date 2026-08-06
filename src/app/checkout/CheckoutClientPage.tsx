"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Clock, Smartphone, AlertTriangle } from "lucide-react";

type EventPaymentMethod = {
  id: string;
  type: "SEND_MONEY" | "BUY_GOODS" | "PAYBILL" | "POCHI_LA_BIASHARA";
  isRecommended: boolean;
  phoneNumber?: string;
  recipientName?: string;
  tillNumber?: string;
  businessName?: string;
  paybillNumber?: string;
  accountNumber?: string;
};

type OrderData = {
  id: string;
  total: number;
  sessionExpiresAt: string | null;
  event: {
    title: string;
    paymentMethods: EventPaymentMethod[];
  };
};

export default function CheckoutClientPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  
  const [order, setOrder] = useState<OrderData | null>(null);
  const [status, setStatus] = useState<"loading" | "pending" | "verifying" | "confirmed" | "failed" | "expired">("loading");
  const [tickets, setTickets] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!orderId) {
      router.push("/");
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const json = await res.json();
        
        if (json.success) {
          setOrder(json.data);
          
          if (json.data.sessionExpiresAt) {
            const expiresAt = new Date(json.data.sessionExpiresAt).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((expiresAt - now) / 1000);
            
            if (diff <= 0) {
              setStatus("expired");
            } else {
              setTimeLeft(diff);
              setStatus("pending");
            }
          } else {
            setStatus("pending");
          }
        } else {
          setErrorMsg("Failed to load order.");
          setStatus("failed");
        }
      } catch (err) {
        setErrorMsg("Network error.");
        setStatus("failed");
      }
    };

    fetchOrder();
  }, [orderId, router]);

  useEffect(() => {
    if (status !== "pending" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeLeft]);

  const handleVerify = async () => {
    if (!confirmationCode.trim()) {
      setErrorMsg("Please enter the M-Pesa confirmation code.");
      return;
    }

    setErrorMsg("");
    setStatus("verifying");

    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, code: confirmationCode.trim().toUpperCase() }),
      });

      const json = await res.json();

      if (json.success) {
        setStatus("confirmed");
        setTickets(json.tickets || []);
      } else {
        setErrorMsg(json.error || "Verification failed. Please check the code and try again.");
        setStatus("pending");
      }
    } catch (err) {
      setErrorMsg("A network error occurred. Please try again.");
      setStatus("pending");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const renderPaymentMethodDetails = (pm: EventPaymentMethod) => {
    switch (pm.type) {
      case "SEND_MONEY":
        return (
          <>
            <p className="text-sm">Phone Number: <span className="font-mono font-bold text-white">{pm.phoneNumber}</span></p>
            {pm.recipientName && <p className="text-sm text-slate-400">Recipient: {pm.recipientName}</p>}
          </>
        );
      case "BUY_GOODS":
        return (
          <>
            <p className="text-sm">Till Number: <span className="font-mono font-bold text-white">{pm.tillNumber}</span></p>
            {pm.businessName && <p className="text-sm text-slate-400">Business: {pm.businessName}</p>}
          </>
        );
      case "PAYBILL":
        return (
          <>
            <p className="text-sm">PayBill Number: <span className="font-mono font-bold text-white">{pm.paybillNumber}</span></p>
            {pm.accountNumber && <p className="text-sm">Account Number: <span className="font-mono font-bold text-white">{pm.accountNumber}</span></p>}
            {pm.businessName && <p className="text-sm text-slate-400">Business: {pm.businessName}</p>}
          </>
        );
      case "POCHI_LA_BIASHARA":
        return (
          <>
            <p className="text-sm">Phone Number: <span className="font-mono font-bold text-white">{pm.phoneNumber}</span></p>
            <p className="text-sm text-slate-400">Pochi la Biashara</p>
          </>
        );
      default:
        return null;
    }
  };

  const formatPaymentType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="min-h-screen page-bg flex items-center justify-center py-12 px-4 text-slate-200">
      <div className="max-w-xl w-full">
        <div className="surface-card rounded-3xl p-8 shadow-2xl">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Clock className="w-10 h-10 text-purple-400 animate-spin mb-4" />
              <p className="text-slate-400">Loading order details...</p>
            </div>
          )}

          {(status === "pending" || status === "verifying") && order && (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Complete Payment</h1>
                <p className="text-slate-400">
                  Total amount due: <span className="text-white font-bold text-lg">KES {order.total}</span>
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-mono text-sm font-semibold">
                    Time remaining: {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              {order.event.paymentMethods.length > 0 ? (
                <div className="space-y-4 mb-8">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Available Payment Methods</h2>
                  {order.event.paymentMethods.map((pm) => (
                    <div key={pm.id} className="relative p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2">
                      {pm.isRecommended && (
                        <span className="absolute -top-3 -right-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          Recommended
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="w-5 h-5 text-indigo-400" />
                        <h3 className="text-white font-semibold">{formatPaymentType(pm.type)}</h3>
                      </div>
                      {renderPaymentMethodDetails(pm)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 mb-8 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm">
                  The organizer has not configured any payment methods for this event.
                </div>
              )}

              <div className="pt-6 border-t border-slate-800">
                <h2 className="text-lg font-bold text-white mb-4">I've completed the payment</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Enter the M-Pesa confirmation code you received (e.g., <span className="font-mono text-slate-300">RKF8H...</span>)
                </p>
                
                {errorMsg && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-red-400 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <p>{errorMsg}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    type="text"
                    value={confirmationCode}
                    onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                    placeholder="M-Pesa Code"
                    disabled={status === "verifying"}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-600"
                  />
                  <button
                    onClick={handleVerify}
                    disabled={status === "verifying" || !confirmationCode.trim()}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                  >
                    {status === "verifying" ? (
                      <>
                        <Clock className="w-5 h-5 animate-spin" />
                        Verifying
                      </>
                    ) : (
                      "Verify Payment"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          {status === "expired" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Clock className="w-10 h-10 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Session Expired</h1>
              <p className="text-slate-400 text-sm mb-6">
                You took too long to complete the payment. This order has been cancelled to free up the tickets for other buyers.
              </p>
              <button
                onClick={() => router.push("/")}
                className="w-full bg-slate-800 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
              >
                Return to Events
              </button>
            </div>
          )}

          {status === "confirmed" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Payment Confirmed!</h1>
              <p className="text-slate-400 text-sm mb-8">
                Your ticket is now confirmed and will appear on your dashboard after successful payment verification.
              </p>
              
              {tickets.length > 0 && (
                <div className="space-y-3 mb-8 text-left">
                  {tickets.map((ticketId, i) => (
                    <Link
                      key={ticketId}
                      href={`/ticket/view/${ticketId}`}
                      className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-5 py-4 hover:border-purple-400 hover:bg-slate-800 transition group"
                    >
                      <span className="font-semibold text-slate-200 group-hover:text-purple-300 transition">Ticket {i + 1}</span>
                      <span className="text-sm text-purple-400 font-semibold group-hover:text-purple-300 transition">View Ticket →</span>
                    </Link>
                  ))}
                </div>
              )}
              
              <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition">
                Browse more events
              </Link>
            </div>
          )}

          {status === "failed" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
              <p className="text-slate-400 text-sm mb-6">{errorMsg || "We couldn't process your request."}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-slate-800 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
