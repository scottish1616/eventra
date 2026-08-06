"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      await signOut({ callbackUrl: "/" });
      router.push("/");
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-purple-800 border-t-purple-400 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Signing out...</p>
      </div>
    </div>
  );
}
