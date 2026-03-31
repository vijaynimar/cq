import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/PaymentPage.css'

const quickAmounts = [100, 250, 500, 1000, 2000]

function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const checkoutFromCart = Boolean(location.state?.checkoutFromCart)
  const [amount, setAmount] = useState('')
  const [upiId, setUpiId] = useState('student@upi')
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const dueTotal = Number(location.state?.total || 0)

  useEffect(() => {
    if (!checkoutFromCart) return
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchWallet = async () => {
      try {
        const response = await fetch(`${serverUrl}/student/wallet/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        if (!response.ok) {
          setError(data.error || 'Failed to fetch wallet')
          return
        }
        setWalletBalance(Number(data.wallet?.balance || 0))
      } catch {
        setError('Unable to connect to server')
      }
    }

    fetchWallet()
  }, [checkoutFromCart, serverUrl])

  const handleDummyTopup = async () => {
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

    setTimeout(() => {
      setIsPaying(false)
      navigate('/wallet', { state: { creditedAmount: numericAmount, paymentRef } })
    }, 1800)
  }

  const handleCheckoutPay = async () => {
    if (!location.state?.pickupTime) {
      setError('Pickup time is missing. Please return to cart.')
      return
    }

    if (walletBalance < dueTotal) {
      setError('Insufficient wallet balance. Please add money first.')
      return
    }

    setError('')
    setIsPaying(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/student/orders/checkout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod: 'wallet',
          pickupTime: location.state.pickupTime,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Payment failed')
        return
      }

      navigate('/orders')
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsPaying(false)
    }
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
          {checkoutFromCart ? (
            <>
              <h1>Order Payment</h1>
              <p className="payment-subtitle">Validate wallet balance and pay for your cart</p>

              <div className="payment-mock-row">
                <div className="payment-mock-item">
                  <span>Wallet Balance</span>
                  <strong>Rs {walletBalance.toFixed(2)}</strong>
                </div>
                <div className="payment-mock-item">
                  <span>Order Total</span>
                  <strong>Rs {dueTotal.toFixed(2)}</strong>
                </div>
              </div>

              <p className="payment-note">
                Pickup Time: {location.state?.pickupTime ? new Date(location.state.pickupTime).toLocaleString() : '-'}
              </p>

              {walletBalance < dueTotal && (
                <p className="payment-error">Wallet balance is low. Add money from Wallet page.</p>
              )}

              {error && <p className="payment-error">{error}</p>}

              <button
                type="button"
                className="pay-now-btn"
                onClick={handleCheckoutPay}
                disabled={isPaying || walletBalance < dueTotal}
              >
                {isPaying ? 'Processing Payment...' : 'Pay & Place Order'}
              </button>
            </>
          ) : (
            <>
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

                <button type="button" className="pay-now-btn" onClick={handleDummyTopup} disabled={isPaying}>
                  {isPaying ? 'Processing UPI Payment...' : 'Pay Now'}
                </button>

                <p className="payment-note">
                  This is a dummy UPI simulation. No real money is debited.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentPage
