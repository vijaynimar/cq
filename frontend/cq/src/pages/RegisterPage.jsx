import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/RegisterPage.css'

function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [focusedField, setFocusedField] = useState(null)
  const navigate = useNavigate()

  const handleRegister = (e) => {
    e.preventDefault()
    // Add registration logic here
    console.log('Register:', { name, email, phone, password })
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

          <button type="submit" className="register-btn">Create Account</button>
        </form>

        <div className="login-link">
          <p>Already have an account? <a onClick={handleLogin} className="link">Login</a></p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
