import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/PaymentPage.css'

const quickAmounts = [100, 250, 500, 1000, 2000]

function PaymentPage() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [upiId, setUpiId] = useState('student@upi')
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')

  const handleDummyPay = async () => {
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      setError('Enter a valid amount to continue')
      return
    }

    if (!upiId.includes('@')) {
      setError('Enter a valid UPI ID')
      return
    }

    setError('')
    setIsPaying(true)

    const paymentRef = `UPI-DEMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Dummy UPI gateway simulation
    setTimeout(() => {
      setIsPaying(false)
      navigate('/wallet', { state: { creditedAmount: numericAmount, paymentRef } })
    }, 1800)
  }

  return (
    <div className="payment-page">
      <div className="payment-shell">
        <div className="payment-topbar">
          <button className="payment-back-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className="payment-wallet-btn" onClick={() => navigate('/wallet')}>
            View Wallet
          </button>
        </div>

        <div className="payment-card">
          <h1>Dummy UPI Payment Gateway</h1>
          <p className="payment-subtitle">Safe sandbox flow for wallet top-up (demo only)</p>

          <div className="payment-amount-presets">
            {quickAmounts.map((value) => (
              <button
                key={value}
                type="button"
                className="amount-chip"
                onClick={() => setAmount(String(value))}
              >
                Rs {value}
              </button>
            ))}
          </div>

          <div className="payment-form">
            <label>Amount (Rs)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter top-up amount"
            />

            <label>UPI ID</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="example@upi"
            />

            <div className="payment-mock-row">
              <div className="payment-mock-item">
                <span>Merchant</span>
                <strong>CQ Wallet Service</strong>
              </div>
              <div className="payment-mock-item">
                <span>Transaction Mode</span>
                <strong>UPI Intent</strong>
              </div>
            </div>

            {error && <p className="payment-error">{error}</p>}

            <button type="button" className="pay-now-btn" onClick={handleDummyPay} disabled={isPaying}>
              {isPaying ? 'Processing UPI Payment...' : 'Pay Now'}
            </button>

            <p className="payment-note">
              This is a dummy UPI simulation. No real money is debited.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
