import React, { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/WalletPage.css'

function WalletPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [walletBalance, setWalletBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [transactions, setTransactions] = useState([])
  const processedPaymentRef = useRef(null)
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const fetchWalletData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const [summaryRes, historyRes] = await Promise.all([
        fetch(`${serverUrl}/student/wallet/summary`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${serverUrl}/student/wallet/history?limit=20&page=1`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const summaryData = await summaryRes.json()
      const historyData = await historyRes.json()

      if (!summaryRes.ok) {
        setError(summaryData.error || 'Failed to fetch wallet')
        return
      }
      if (!historyRes.ok) {
        setError(historyData.error || 'Failed to fetch wallet history')
        return
      }

      setWalletBalance(Number(summaryData.wallet?.balance || 0))
      setTransactions(historyData.transactions || [])
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('role')
    const token = localStorage.getItem('token')
    if (!token || role !== 'student') {
      navigate('/dashboard')
      return
    }

    fetchWalletData()
  }, [navigate])

  const handleCreditWallet = async (amount, referenceId) => {
    setIsUpdating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/student/wallet/topup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(amount),
          paymentMethod: 'upi',
          referenceId: referenceId || `UPI-${Date.now()}`,
        }),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Failed to update wallet')
        return
      }

      setWalletBalance(Number(result.balance || walletBalance))
      await fetchWalletData()
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsUpdating(false)
    }
  }

  useEffect(() => {
    const creditedAmount = location.state?.creditedAmount
    const paymentRef = location.state?.paymentRef
    if (creditedAmount && paymentRef && processedPaymentRef.current !== paymentRef) {
      processedPaymentRef.current = paymentRef
      handleCreditWallet(creditedAmount, paymentRef)
      navigate('/wallet', { replace: true })
    }
  }, [location.state])

  return (
    <div className="wallet-page">
      <div className="wallet-shell">
        <div className="wallet-topbar">
          <button className="wallet-back-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
          <button className="wallet-pay-btn" onClick={() => navigate('/payment')}>
            Add Money
          </button>
        </div>

        <div className="wallet-hero">
          <p className="wallet-label">Current Wallet Balance</p>
          <h1>
            Rs {isLoading ? '...' : walletBalance.toFixed(2)}
          </h1>
          {isUpdating && <p className="wallet-updating">Updating wallet...</p>}
          {error && <p className="wallet-error">{error}</p>}
        </div>

        <div className="wallet-transactions">
          <h2>Wallet Transaction History</h2>
          {transactions.length === 0 ? (
            <p className="wallet-empty">No wallet transactions yet. Add money from Payment page.</p>
          ) : (
            <div className="wallet-tx-list">
              {transactions.map((tx) => (
                <div key={tx._id || tx.id} className="wallet-tx-item">
                  <div>
                    <p className="wallet-tx-title">{tx.category || 'wallet'} ({tx.type})</p>
                    <p className="wallet-tx-time">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="wallet-tx-right">
                    <p className="wallet-tx-amount">
                      {tx.type === 'debit' ? '-' : '+'} Rs {Number(tx.amount || 0).toFixed(2)}
                    </p>
                    <span className="wallet-tx-status">{tx.status || 'success'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default WalletPage
