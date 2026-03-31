import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/DashboardPage.css'

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

function DashboardPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')

  const navItems = useMemo(() => {
    if (role === 'admin') {
      return [
        { label: 'Profile', icon: 'P' },
        { label: 'Products', icon: 'PR' },
        { label: 'Students', icon: 'ST' },
        { label: 'Orders', icon: 'OR' },
        { label: 'Support', icon: 'SP' }
      ]
    }

    return [
      { label: 'Profile', icon: 'P' },
      { label: 'Cart', icon: 'C' },
      { label: 'Wallet', icon: 'W' },
      { label: 'Orders', icon: 'OR' },
      { label: 'Support', icon: 'SP' }
    ]
  }, [role])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

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

    const tokenRole = decodeTokenRole(token)
    if (tokenRole === 'admin' || tokenRole === 'student') {
      localStorage.setItem('role', tokenRole)
      setRole(tokenRole)
      return
    }

    setRole('student')
  }, [navigate])

  const handleNavClick = (label) => {
    if (label === 'Profile') {
      navigate('/profile')
      } else if (label === 'Products') {
          navigate('/products')
        }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-shell">
        <nav className="dashboard-navbar">
          <div className="navbar-left">
            <span className={`role-pill ${role}`}>{role === 'admin' ? 'Role: Admin' : 'Role: Student'}</span>
          </div>
          <div className="navbar-right">
            {[...navItems].reverse().map((item) => (
              <button
                type="button"
                key={item.label}
                className="nav-action"
                onClick={() => handleNavClick(item.label)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="dashboard-card">
          <h1>{role === 'admin' ? 'Admin dashboard ready' : 'Student dashboard ready'}</h1>
          <p>
            {role === 'admin'
              ? 'Manage products, students, and orders from the top navigation.'
              : 'Track your cart, wallet, and orders from the top navigation.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
