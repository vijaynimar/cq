import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/RegisterPage.css'

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otpMessage, setOtpMessage] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const navigate = useNavigate()
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setOtpMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${serverUrl}/user/send-registration-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: name,
          email,
          phone,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }

      setShowOtpModal(true)
      setOtpMessage('OTP sent to your email. Please verify to create your account.')
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setIsVerifyingOtp(true)

    try {
      const response = await fetch(`${serverUrl}/user/verify-registration-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'OTP verification failed')
        return
      }

      setShowOtpModal(false)
      navigate('/login')
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setOtpMessage('')
    setIsLoading(true)

    try {
      const response = await fetch(`${serverUrl}/user/send-registration-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: name,
          email,
          phone,
          password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to resend OTP')
        return
      }

      setOtpMessage('A new OTP has been sent to your email.')
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <h2 className="register-title">Join Us</h2>
        <p className="register-subtitle">Create your account to get started</p>
        <form onSubmit={handleRegister}>
          <div className={`form-group ${focusedField === 'name' ? 'focused' : ''} ${name ? 'filled' : ''}`}>
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              required
            />
            <span className="input-underline"></span>
          </div>

          <div className={`form-group ${focusedField === 'email' ? 'focused' : ''} ${email ? 'filled' : ''}`}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
            />
            <span className="input-underline"></span>
          </div>

          <div className={`form-group ${focusedField === 'phone' ? 'focused' : ''} ${phone ? 'filled' : ''}`}>
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              required
            />
            <span className="input-underline"></span>
          </div>

          <div className={`form-group ${focusedField === 'password' ? 'focused' : ''} ${password ? 'filled' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required
            />
            <span className="input-underline"></span>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="register-btn" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="login-link">
          <p>Already have an account? <a onClick={handleLogin} className="link">Login</a></p>
        </div>
      </div>

      {showOtpModal && (
        <div className="otp-modal-overlay">
          <div className="otp-modal">
            <h3>Verify Email OTP</h3>
            <p>Enter the 6-digit OTP sent to <strong>{email}</strong></p>
            {otpMessage && <p className="otp-message">{otpMessage}</p>}
            <form onSubmit={handleVerifyOtp}>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP"
                className="otp-input"
                required
              />

              <div className="otp-actions">
                <button type="submit" className="register-btn" disabled={isVerifyingOtp}>
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button type="button" className="otp-resend-btn" disabled={isLoading} onClick={handleResendOtp}>
                  {isLoading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterPage
