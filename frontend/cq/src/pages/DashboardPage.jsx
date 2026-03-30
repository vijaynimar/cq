import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/DashboardPage.css'

function DashboardPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h1>Logged in successfully</h1>
      </div>
    </div>
  )
}

export default DashboardPage
