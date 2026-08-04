import { Suspense } from "react";
import CheckoutClientPage from "../CheckoutClientPage";

export default function MpesaPendingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-300">Loading payment verification...</div>}>
      <CheckoutClientPage />
    </Suspense>
  );
}
