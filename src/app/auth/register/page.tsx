import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen page-bg text-slate-200 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl text-white shadow-lg">
          🎟️
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Eventra</h1>
        <p className="text-slate-400 text-sm mb-10 leading-relaxed">
          Kenya's event ticketing platform. Ready to sell tickets?
        </p>

        <div className="space-y-3 mb-8">
          <Link
            href="/auth/organizer-register"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-2xl text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4" />
            Register as Organizer
          </Link>
          <p className="text-xs text-slate-400">
            New organizers require admin approval
          </p>
        </div>

        <div className="border-t border-slate-700 pt-6 space-y-3">
          <p className="text-xs text-slate-400">Already have an account?</p>
          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center border border-slate-700 text-slate-200 py-3 rounded-2xl text-sm font-semibold hover:bg-slate-900 transition"
          >
            Sign in <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>

        <Link
          href="/"
          className="mt-6 inline-block text-sm text-slate-400 hover:text-slate-200"
        >
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
