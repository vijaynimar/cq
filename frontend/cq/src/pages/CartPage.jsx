import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/CartPage.css'

function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const fetchCart = async () => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/student/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to load cart')
        return
      }
      setCart(data)
    } catch {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const role = localStorage.getItem('role')
    const token = localStorage.getItem('token')
    if (!token || role !== 'student') {
      navigate('/dashboard')
      return
    }
    fetchCart()
  }, [navigate])

  const updateQty = async (itemId, quantity) => {
    if (quantity < 1) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/student/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to update quantity')
        return
      }
      setCart(data)
    } catch {
      setError('Unable to connect to server')
    }
  }

  const removeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/student/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to remove item')
        return
      }
      setCart(data)
    } catch {
      setError('Unable to connect to server')
    }
  }

  const proceedToPayment = () => {
    if (!pickupTime) {
      setError('Please select pickup time')
      return
    }
    if (!cart?.items?.length) {
      setError('Cart is empty')
      return
    }

    const subTotal = Number(cart.subTotal || 0)
    const tax = Number((subTotal * 0.05).toFixed(2))
    const delivery = subTotal > 0 ? 20 : 0
    const total = Number((subTotal + tax + delivery).toFixed(2))

    navigate('/payment', {
      state: {
        checkoutFromCart: true,
        pickupTime,
        subTotal,
        tax,
        delivery,
        total,
      },
    })
  }

  return (
    <div className="cart-page">
      <div className="cart-shell">
        <div className="cart-topbar">
          <h1>Your Cart</h1>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>

        {error && <p className="cart-error">{error}</p>}

        {loading ? (
          <p>Loading cart...</p>
        ) : !cart?.items?.length ? (
          <p>Your cart is empty. Add products from dashboard.</p>
        ) : (
          <div className="cart-layout single-column">
            <div className="cart-panel">
              <h2>Items ({cart?.totalItems || 0})</h2>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <div className="cart-item" key={item._id}>
                    <div>
                      <p>{item.nameSnapshot}</p>
                      <small>Rs {Number(item.priceSnapshot || 0).toFixed(2)}</small>
                    </div>
                    <div className="qty-controls">
                      <button onClick={() => updateQty(item._id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeItem(item._id)}>Remove</button>
                  </div>
                ))}
              </div>

              <div className="checkout-box">
                <p>Subtotal: Rs {Number(cart?.subTotal || 0).toFixed(2)}</p>
                <label>Scheduled Pickup Time</label>
                <input type="datetime-local" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                <button onClick={proceedToPayment}>Proceed to Payment</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CartPage
