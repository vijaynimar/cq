import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ProductsPage from './pages/ProductsPage'
import WalletPage from './pages/WalletPage'
import PaymentPage from './pages/PaymentPage'
import StudentsPage from './pages/StudentsPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/payment" element={<PaymentPage />} />
      </Routes>
    </Router>
  )
}

export default App