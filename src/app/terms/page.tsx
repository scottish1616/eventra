import Link from "next/link";
import { Ticket } from "lucide-react";

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of terms",
      content: "By using Eventra, you agree to these Terms of Service. If you do not agree to these terms, please do not use our platform.",
    },
    {
      title: "Use of the platform",
      content: "Eventra is a ticketing platform that connects event organizers with attendees in Kenya. You may use our platform to purchase tickets, create events, and manage attendees. You agree not to use our platform for any unlawful purpose.",
    },
    {
      title: "Ticket purchases",
      content: "All ticket purchases are final unless the event is cancelled by the organizer. Refund policies are set by individual event organizers. We facilitate payments through M-Pesa and are not responsible for organizer refund decisions.",
    },
    {
      title: "Organizer responsibilities",
      content: "Event organizers are responsible for the accuracy of event information, delivering promised event experiences, handling attendee complaints, and complying with all applicable laws and regulations.",
    },
    {
      title: "Platform fees",
      content: "Eventra charges a platform fee on each ticket sold. This fee is included in the ticket price displayed to attendees. Organizers receive the ticket price minus the platform fee.",
    },
    {
      title: "Account termination",
      content: "We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or misuse the platform. Organizer accounts require admin approval and can be deactivated for non-payment of subscription.",
    },
    {
      title: "Limitation of liability",
      content: "Eventra is not liable for any damages arising from your use of the platform, including but not limited to event cancellations, ticket disputes, or technical issues. Our liability is limited to the amount paid for the ticket in question.",
    },
    {
      title: "Changes to terms",
      content: "We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg text-white">EVENTRA</span>
          </Link>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-20 max-w-3xl mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-white mb-3">Terms of Service</h1>
          <p className="text-gray-400">Last updated: July 2026</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">
                {i + 1}. {section.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 p-6 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <p className="text-sm text-gray-300">
            Questions about these terms?{" "}
            <Link href="/contact" className="text-purple-400 font-semibold hover:text-purple-300">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}