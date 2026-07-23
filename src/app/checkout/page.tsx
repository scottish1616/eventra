import { Suspense } from "react";
import CheckoutClientPage from "./CheckoutClientPage";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CheckoutClientPage />
    </Suspense>
  );
}
