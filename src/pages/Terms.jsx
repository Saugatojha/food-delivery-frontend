import { Link } from 'react-router-dom'

export default function Terms() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-sm text-gray-700 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Terms of Service</h1>
      <p>Last updated: July 2026</p>
      <h2 className="font-semibold text-base">1. Acceptance</h2>
      <p>By creating an account you agree to these terms. If you do not agree, do not use the service.</p>
      <h2 className="font-semibold text-base">2. Orders</h2>
      <p>All orders placed through the platform are final. Cancellation is at the restaurant's discretion. Prices are set by restaurants and may change without notice.</p>
      <h2 className="font-semibold text-base">3. Accounts</h2>
      <p>You are responsible for keeping your password secure. You must be at least 16 years old to register.</p>
      <h2 className="font-semibold text-base">4. Limitation of Liability</h2>
      <p>We are a platform connecting users with restaurants. We are not liable for food quality, delivery delays, or any damages arising from your use of the service.</p>
      <Link to="/register" className="text-orange-500 underline inline-block mt-4">Back to Register</Link>
    </div>
  )
}