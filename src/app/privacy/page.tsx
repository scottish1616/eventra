import Link from "next/link";
import { Ticket } from "lucide-react";

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information we collect",
      content: "We collect information you provide directly to us, such as your name, phone number, and email address when you create an account or purchase a ticket. We also collect payment information processed through M-Pesa, though we do not store your M-Pesa PIN.",
    },
    {
      title: "How we use your information",
      content: "We use the information we collect to process ticket purchases, send you ticket confirmations, provide customer support, improve our services, and communicate with you about events you may be interested in.",
    },
    {
      title: "Information sharing",
      content: "We share your name and contact information with event organizers for the events you attend. We do not sell your personal information to third parties. We may share information with service providers who assist us in operating our platform.",
    },
    {
      title: "Data security",
      content: "We implement appropriate security measures to protect your personal information. All payments are processed through Safaricom's secure M-Pesa platform. We use industry-standard encryption for data transmission.",
    },
    {
      title: "Your rights",
      content: "You have the right to access, update, or delete your personal information. You can manage your account settings from your dashboard. To request deletion of your account, contact us at admin@eventra.com.",
    },
    {
      title: "Cookies",
      content: "We use cookies to maintain your session and improve your experience on our platform. You can control cookie settings through your browser preferences.",
    },
    {
      title: "Contact us",
      content: "If you have questions about this privacy policy or our data practices, please contact us at admin@eventra.com or call +254 700 000 000.",
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
          <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: July 2026</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">{section.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}