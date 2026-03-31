import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/OrdersPage.css'

const kitchenOptions = ['received', 'preparing', 'ready', 'completed', 'cancelled']

function OrdersPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const fetchOrders = async (activeRole) => {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const endpoint = activeRole === 'admin' ? '/admin/orders/live-queue' : '/student/orders'
      const response = await fetch(`${serverUrl}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to load orders')
        return
      }
      setOrders(data)
    } catch {
      setError('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role') || 'student'
    if (!token) {
      navigate('/login')
      return
    }
    setRole(savedRole)
    fetchOrders(savedRole)

    if (savedRole === 'admin') {
      const timer = setInterval(() => fetchOrders(savedRole), 15000)
      return () => clearInterval(timer)
    }
  }, [navigate])

  const updateKitchenStatus = async (orderId, kitchenStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kitchenStatus }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to update status')
        return
      }
      setOrders((prev) => prev.map((o) => (o._id === orderId ? data : o)))
    } catch {
      setError('Unable to connect to server')
    }
  }

  return (
    <div className="orders-page">
      <div className="orders-shell">
        <div className="orders-topbar">
          <h1>{role === 'admin' ? 'All Order History' : 'My Orders'}</h1>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>

        {error && <p className="orders-error">{error}</p>}

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <div className="order-card" key={order._id}>
                <div className="order-head">
                  <h3>{order.orderNumber}</h3>
                  <p>Pickup: {order.pickupTime ? new Date(order.pickupTime).toLocaleString() : '-'}</p>
                </div>

                <div className="order-items">
                  {order.items?.map((item, idx) => (
                    <p key={idx}>{item.nameSnapshot} x {item.quantity}</p>
                  ))}
                </div>

                <p>Total: Rs {Number(order.amountSummary?.total || 0).toFixed(2)}</p>
                <p>Payment: {order.payment?.status}</p>
                <p>Kitchen Status: {order.kitchenStatus || 'received'}</p>

                {role === 'admin' && (
                  <select
                    value={order.kitchenStatus || 'received'}
                    disabled={(order.kitchenStatus || 'received') === 'completed'}
                    onChange={(e) => updateKitchenStatus(order._id, e.target.value)}
                  >
                    {kitchenOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
                {role === 'admin' && (order.kitchenStatus || 'received') === 'completed' && (
                  <p className="orders-note">Completed order status is locked.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage
