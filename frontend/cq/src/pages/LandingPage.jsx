import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()

  const handleStartClick = () => {
    navigate('/login')
  }

  return (
    <div className="landing-page">
      <div className="content-container">
        <h1 className="name-title">MINAKSHI THAKUR</h1>
        <button className="start-button" onClick={handleStartClick}>Start Here</button>
      </div>
    </div>
  )
}

export default LandingPage
