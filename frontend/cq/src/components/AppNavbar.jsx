import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/AppNavbar.css'

const decodeTokenRole = (token) => {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized))
    return payload?.role || null
  } catch {
    return null
  }
}

function AppNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState('student')

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role')

    if (savedRole === 'admin' || savedRole === 'student') {
      setRole(savedRole)
      return
    }

    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (savedUser?.role === 'admin' || savedUser?.role === 'student') {
        localStorage.setItem('role', savedUser.role)
        setRole(savedUser.role)
        return
      }
    } catch {
      // Ignore parse error and continue to token fallback.
    }

    if (token) {
      const tokenRole = decodeTokenRole(token)
      if (tokenRole === 'admin' || tokenRole === 'student') {
        localStorage.setItem('role', tokenRole)
        setRole(tokenRole)
        return
      }
    }

    setRole('student')
  }, [location.pathname])

  const navItems = useMemo(() => {
    if (role === 'admin') {
      return [
        { label: 'Profile', icon: 'P', path: '/profile' },
        { label: 'Products', icon: 'PR', path: '/products' },
        { label: 'Students', icon: 'ST', path: '/students' },
        { label: 'Orders', icon: 'OR', path: '/orders' },
      ]
    }

    return [
      { label: 'Profile', icon: 'P', path: '/profile' },
      { label: 'Cart', icon: 'C', path: '/cart' },
      { label: 'Wallet', icon: 'W', path: '/wallet' },
      { label: 'Payment', icon: 'PY', path: '/payment' },
      { label: 'Orders', icon: 'OR', path: '/orders' },
    ]
  }, [role])

  return (
    <nav className="app-navbar">
      <div className="app-navbar-left">
        <button
          type="button"
          className="app-brand-title"
          onClick={() => navigate('/dashboard')}
        >
          Crave Cart
        </button>
      </div>
      <div className="app-navbar-right">
        {[...navItems].reverse().map((item) => (
          <button
            type="button"
            key={item.label}
            className="app-nav-action"
            onClick={() => navigate(item.path)}
          >
            <span className="app-nav-icon">{item.icon}</span>
            <span className="app-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}

export default AppNavbar
