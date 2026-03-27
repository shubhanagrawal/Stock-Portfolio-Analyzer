export default function SkeletonCard() {
  return (
    <div className="bg-gray-800 p-4 rounded border border-gray-700 animate-pulse flex flex-col justify-center h-20">
      <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
      <div className="h-6 bg-gray-700 rounded w-3/4"></div>
    </div>
  )
}
