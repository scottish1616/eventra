import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">
          🎟️
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Want to sell tickets?
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Eventra is invite-only for organizers. Contact the admin to get
          your organizer account created.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Contact admin
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              📧 admin@eventra.app
            </p>
            <p className="text-sm text-gray-700">
              📱 +254 700 000 000
            </p>
          </div>
        </div>
        <Link
          href="/auth/login"
          className="w-full inline-flex items-center justify-center bg-violet-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-violet-700 transition"
        >
          Sign in as organizer
        </Link>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-gray-400 hover:text-gray-600"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}