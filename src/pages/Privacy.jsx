import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto p-6 text-sm text-gray-700 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
      <p>Last updated: July 2026</p>
      <h2 className="font-semibold text-base">Data We Collect</h2>
      <p>We collect your name, email, delivery address, phone number, and order history to provide and improve our service.</p>
      <h2 className="font-semibold text-base">How We Use It</h2>
      <p>Your data is used to process orders, communicate delivery updates, and improve the platform. We do not sell your personal data to third parties.</p>
      <h2 className="font-semibold text-base">Data Retention</h2>
      <p>We retain your data for as long as your account is active. You may request deletion by contacting support.</p>
      <h2 className="font-semibold text-base">Contact</h2>
      <p>For questions, email privacy@fooddelivery.app</p>
      <Link to="/register" className="text-orange-500 underline inline-block mt-4">Back to Register</Link>
    </div>
  )
}