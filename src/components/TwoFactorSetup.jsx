import { useState } from 'react'
import api from '../api/client'
import { useToast } from '../context/ToastContext'

export default function TwoFactorSetup({ enabled, onComplete }) {
  const { showToast } = useToast()
  const [step, setStep] = useState(enabled ? 'enabled' : 'idle')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [loading, setLoading] = useState(false)

  const setup = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/2fa/setup')
      setQrCode(data.qrCode)
      setSecret(data.secret)
      setStep('scan')
    } catch {
      showToast('Failed to start 2FA setup', 'error')
    } finally {
      setLoading(false)
    }
  }

  const enable = async () => {
    if (!code || code.length !== 6) return showToast('Enter the 6-digit code from your app', 'error')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/2fa/enable', { token: code })
      setBackupCodes(data.backupCodes)
      setStep('enabled')
      showToast('2FA enabled successfully', 'success')
      onComplete?.()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Invalid code', 'error')
    } finally {
      setLoading(false)
    }
  }

  const disable = async () => {
    if (!code || code.length !== 6) return showToast('Enter the 6-digit code from your app', 'error')
    setLoading(true)
    try {
      await api.post('/auth/2fa/disable', { token: code })
      setStep('idle')
      setCode('')
      setQrCode('')
      showToast('2FA disabled', 'success')
      onComplete?.()
    } catch (err) {
      showToast(err?.response?.data?.error || 'Invalid code', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'enabled' && backupCodes.length > 0) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold text-sm mb-2">2FA Enabled</h3>
        <p className="text-sm text-gray-600 mb-3">Save these backup codes somewhere safe. Each can be used once if you lose access to your authenticator app.</p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {backupCodes.map(c => (
            <code key={c} className="bg-gray-100 border rounded p-2 text-sm text-center font-mono">{c}</code>
          ))}
        </div>
        <button onClick={() => { setBackupCodes([]); setStep('enabled') }} className="text-sm text-orange-600 hover:underline">Done</button>
      </div>
    )
  }

  if (step === 'enabled') {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">Two-Factor Authentication</h3>
            <p className="text-xs text-green-600 mt-1">Enabled</p>
          </div>
          <button onClick={() => setStep('disable')} className="text-sm text-red-600 hover:underline">Disable</button>
        </div>
        {step === 'disable' && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">Enter code from your authenticator app to disable 2FA:</p>
            <div className="flex gap-2">
              <input className="border p-2 rounded text-sm flex-1" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              <button onClick={disable} disabled={loading} className="bg-red-500 text-white px-3 py-2 rounded text-sm disabled:opacity-50">{loading ? '...' : 'Disable'}</button>
            </div>
            <button onClick={() => { setStep('enabled'); setCode('') }} className="text-xs text-gray-500 mt-2 hover:underline">Cancel</button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'scan') {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="font-semibold text-sm mb-3">Setup Two-Factor Authentication</h3>
        <p className="text-xs text-gray-500 mb-3">Scan this QR code with Google Authenticator or Authy:</p>
        <div className="flex justify-center mb-3">
          <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
        </div>
        <p className="text-xs text-gray-400 text-center mb-3">Or enter this key manually: <code className="bg-gray-100 px-1 rounded">{secret}</code></p>
        <p className="text-xs text-gray-500 mb-2">Enter the 6-digit code from your app to confirm:</p>
        <div className="flex gap-2">
          <input className="border p-2 rounded text-sm flex-1" placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
          <button onClick={enable} disabled={loading || code.length !== 6} className="bg-green-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50">{loading ? '...' : 'Verify & Enable'}</button>
        </div>
        <button onClick={() => { setStep('idle'); setCode(''); setQrCode('') }} className="text-xs text-gray-500 mt-2 hover:underline">Cancel</button>
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white">
      <h3 className="font-semibold text-sm mb-1">Two-Factor Authentication</h3>
      <p className="text-xs text-gray-500 mb-3">Add an extra layer of security to your account with an authenticator app.</p>
      <button onClick={setup} disabled={loading} className="bg-orange-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {loading ? 'Setting up...' : 'Enable 2FA'}
      </button>
    </div>
  )
}
