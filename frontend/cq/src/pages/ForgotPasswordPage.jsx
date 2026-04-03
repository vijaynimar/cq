import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/ForgotPasswordPage.css'

function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch(`${serverUrl}/user/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to send reset OTP')
        return
      }

      navigate('/reset-password', { state: { email } })
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="forgot-container">
      <div className="forgot-box">
        <h2>Forgot Password</h2>
        <p>Enter your registered email and we will send you a reset OTP.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="forgot-email">Email</label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          {error && <p className="forgot-error">{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset OTP'}
          </button>
        </form>

        <button type="button" className="back-link" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
