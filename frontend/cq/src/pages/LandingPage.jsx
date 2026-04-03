import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/LandingPage.css'
import landingImage from '../assets/landing.jpg'

function LandingPage() {
  const navigate = useNavigate()

  const handleStartClick = () => {
    navigate('/login')
  }

  return (
    <div className="landing-hero" style={{ backgroundImage: `url(${landingImage})` }}>
      <div className="landing-content">
        <h1 className="landing-title">Crave Cart</h1>
        <h1 className="landing-title">BY</h1>
        <h1 className="landing-title">MINAKSHI THAKUR</h1>
        <button className="landing-start-button" onClick={handleStartClick}>Start Here</button>
      </div>
    </div>
  )
}

export default LandingPage
