export default function EmptyState({ icon = '📭', title, message, action }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-gray-500 mb-4">{message}</p>}
      {action}
    </div>
  )
}
