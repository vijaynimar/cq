import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/ResetPasswordPage.css'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialEmail = location.state?.email || ''
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!email) {
      setError('Email is required')
      return
    }

    if (!otp) {
      setError('OTP is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${serverUrl}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to reset password')
        return
      }

      setMessage(data.message || 'Password reset successful')
      setTimeout(() => navigate('/login'), 1200)
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setMessage('')

    if (!email) {
      setError('Email is required to resend OTP')
      return
    }

    setIsResending(true)
    try {
      const response = await fetch(`${serverUrl}/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to resend OTP')
        return
      }

      setMessage(data.message || 'A new OTP has been sent to your email')
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Reset Password</h2>
        <p>Enter your email, OTP and new password below.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="otp">OTP</label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter OTP"
            maxLength={6}
            required
          />

          <label htmlFor="new-password">New Password</label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />

          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            required
          />

          {error && <p className="reset-error">{error}</p>}
          {message && <p className="reset-success">{message}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </button>

          <button type="button" className="resend-btn" onClick={handleResendOtp} disabled={isResending}>
            {isResending ? 'Resending...' : 'Resend OTP'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
