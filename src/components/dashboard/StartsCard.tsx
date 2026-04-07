interface Props {
  label: string;
  value: string;
  color: string;
}

export function StatsCard({ label, value, color }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p
        className={`text-xs font-medium px-2 py-1 rounded-lg inline-block mb-3 ${color}`}
      >
        {label}
      </p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
