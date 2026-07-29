export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/4" />
    </div>
  )
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  )
}
