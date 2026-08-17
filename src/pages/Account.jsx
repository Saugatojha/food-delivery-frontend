import { useAuth } from '../context/AuthContext'
import TwoFactorSetup from '../components/TwoFactorSetup'

export default function Account() {
  const { user } = useAuth()

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Account</h1>
      <div className="border rounded-lg p-4 bg-white mb-4">
        <h2 className="font-semibold text-sm mb-2">Profile</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name:</span> {user?.name}</div>
          <div><span className="text-gray-500">Email:</span> {user?.email}</div>
          <div><span className="text-gray-500">Role:</span> {user?.role}</div>
          <div><span className="text-gray-500">Email Verified:</span> {user?.emailVerified ? 'Yes' : 'No'}</div>
        </div>
      </div>
      <TwoFactorSetup enabled={user?.twoFactorEnabled} />
    </div>
  )
}
