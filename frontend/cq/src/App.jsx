import React from 'react'
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import ProductsPage from './pages/ProductsPage'
import WalletPage from './pages/WalletPage'
import PaymentPage from './pages/PaymentPage'
import StudentsPage from './pages/StudentsPage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import AppNavbar from './components/AppNavbar'
import './App.css'

function AppLayout() {
  return (
    <>
      <AppNavbar />
      <Outlet />
    </>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/payment" element={<PaymentPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App