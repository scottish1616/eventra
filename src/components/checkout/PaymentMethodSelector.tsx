"use client";

interface PaymentMethod {
  value: string;
  label: string;
  desc: string;
  icon: string;
}

interface Props {
  selected: string;
  onChange: (value: string) => void;
}

const methods: PaymentMethod[] = [
  {
    value: "MPESA",
    label: "M-Pesa",
    desc: "Pay via STK push to your phone",
    icon: "📱",
  },
  {
    value: "STRIPE",
    label: "Card",
    desc: "Visa, Mastercard, or debit card",
    icon: "💳",
  },
  {
    value: "SIMULATED",
    label: "Test payment",
    desc: "For demo — no real charge",
    icon: "⚡",
  },
];

export function PaymentMethodSelector({ selected, onChange }: Props) {
  return (
    <div className="space-y-3">
      {methods.map((m) => (
        <button
          key={m.value}
          type="button"
          onClick={() => onChange(m.value)}
          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
            selected === m.value
              ? "border-violet-500 bg-violet-50"
              : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <span className="text-2xl">{m.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{m.label}</p>
            <p className="text-xs text-gray-500">{m.desc}</p>
          </div>
          {selected === m.value && (
            <div className="w-4 h-4 rounded-full bg-violet-600 flex-shrink-0" />
          )}
        </button>
      ))}
    </div>
  );
}
