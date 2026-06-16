export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="skeleton w-16 h-4 rounded" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`skeleton h-3 rounded mb-2 ${i === rows - 1 ? "w-2/3" : "w-full"}`} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-gray-800">
      {[80, 60, 40, 30, 25].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className={`skeleton h-4 rounded`} style={{ width: `${w}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 animate-pulse flex items-center gap-4">
          <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 rounded w-3/4" />
            <div className="skeleton h-3 rounded w-1/2" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}