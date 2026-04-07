import Link from "next/link";

interface Props {
  id: string;
  ticketNumber: string;
  eventTitle: string;
  eventDate: string;
  ticketTypeName: string;
  category: string;
  price: number;
  isUsed: boolean;
}

export function TicketCard({
  id,
  ticketNumber,
  eventTitle,
  eventDate,
  ticketTypeName,
  category,
  price,
  isUsed,
}: Props) {
  const categoryColors: Record<string, string> = {
    REGULAR: "bg-blue-50 text-blue-700",
    VIP: "bg-amber-50 text-amber-700",
    VVIP: "bg-violet-50 text-violet-700",
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <Link href={`/ticket/${id}`}>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex items-center gap-5 cursor-pointer">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${categoryColors[category]}`}
        >
          🎫
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm truncate">
                {eventTitle}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {ticketTypeName} · {ticketNumber}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${categoryColors[category]}`}
            >
              {category}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-xs text-gray-500">
              📅 {formatDate(eventDate)}
            </span>
            <span className="text-xs font-medium text-gray-700">
              {formatCurrency(price)}
            </span>
            <span
              className={`text-xs ${isUsed ? "text-gray-400" : "text-emerald-600"}`}
            >
              {isUsed ? "Used" : "✓ Valid"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
