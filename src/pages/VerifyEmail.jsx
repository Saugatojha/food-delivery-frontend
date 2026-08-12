import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyEmail, resendVerification } = useAuth()
  const { showToast } = useToast()
  const email = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState(token ? 'verifying' : 'waiting')
  const [message, setMessage] = useState('')
  const [devLink, setDevLink] = useState('')
  const [sending, setSending] = useState(false)
  const verifiedRef = useRef(false)

  useEffect(() => {
    if (!token || verifiedRef.current) return
    verifiedRef.current = true
    verifyEmail(token, email).then(data => {
      setStatus('success')
      setMessage(data.message || 'Email verified successfully')
      showToast('Email verified! You can now log in.', 'success')
      setTimeout(() => navigate('/login'), 2000)
    }).catch(err => {
      setStatus('error')
      setMessage(err?.response?.data?.error || 'Verification failed. Request a new link.')
      showToast('Verification failed', 'error')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const resend = async () => {
    if (!email) return showToast('Email is required', 'error')
    setSending(true)
    try {
      const data = await resendVerification(email)
      setStatus('sent')
      setMessage(data.message || 'Verification email sent')
      setDevLink(data.devLink || '')
      showToast('Verification email sent', 'success')
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Failed to resend verification email')
      showToast('Failed to resend verification email', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <div className="border rounded-lg p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-bold mb-3">Verify Your Email</h1>

        {status === 'verifying' && <p className="text-gray-600 text-sm">Verifying your email...</p>}

        {status === 'success' && <p className="text-green-600 text-sm font-medium mb-2">{message}</p>}

        {status === 'error' && (
          <div>
            <p className="text-red-600 text-sm font-medium mb-3">{message}</p>
            <button onClick={resend} disabled={sending}
              className="bg-orange-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
              {sending ? 'Sending...' : 'Resend verification link'}
            </button>
          </div>
        )}

        {(status === 'waiting' || status === 'sent') && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              We sent a verification link to <span className="font-medium">{email || 'your email'}</span>.
              Click the link in the email to activate your account before logging in.
            </p>
            <button onClick={resend} disabled={sending}
              className="bg-orange-500 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
              {sending ? 'Sending...' : 'Resend verification link'}
            </button>
          </div>
        )}

        {status === 'sent' && <p className="text-green-600 text-sm font-medium mt-3">{message}</p>}

        {devLink && (
          <a
            href={devLink}
            className="mt-4 block text-center text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded px-4 py-2"
          >
            Open verification link
          </a>
        )}

        <div className="mt-5 text-sm">
          <Link to="/login" className="text-orange-600 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  )
}
