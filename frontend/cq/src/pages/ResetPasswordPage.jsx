import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../styles/ResetPasswordPage.css'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
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

    setIsLoading(true)
    try {
      const response = await fetch(`${serverUrl}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
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

  return (
    <div className="reset-container">
      <div className="reset-box">
        <h2>Reset Password</h2>
        <p>Set your new password below.</p>

        <form onSubmit={handleSubmit}>
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
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
