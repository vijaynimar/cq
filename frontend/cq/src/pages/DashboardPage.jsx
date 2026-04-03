import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/DashboardPage.css'

const PIE_COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8', '#1e40af', '#bfdbfe', '#dbeafe']

const decodeTokenRole = (token) => {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(normalized))
    return payload?.role || null
  } catch {
    return null
  }
}

function DashboardPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('student')
  const [frequentOrders, setFrequentOrders] = useState([])
  const [products, setProducts] = useState([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [addingProductId, setAddingProductId] = useState('')
  const [dashboardError, setDashboardError] = useState('')
  const [adminAnalytics, setAdminAnalytics] = useState({
    salesByDay: [],
    popularItems: [],
    ordersPerHour: [],
  })
  const [isLoadingAdminAnalytics, setIsLoadingAdminAnalytics] = useState(false)
  const [adminAnalyticsError, setAdminAnalyticsError] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dietFilter, setDietFilter] = useState('all')
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const savedRole = localStorage.getItem('role')
    if (savedRole === 'admin' || savedRole === 'student') {
      setRole(savedRole)
      return
    }

    try {
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
      if (savedUser?.role === 'admin' || savedUser?.role === 'student') {
        localStorage.setItem('role', savedUser.role)
        setRole(savedUser.role)
        return
      }
    } catch {
      // Ignore parse error and continue to token fallback.
    }

    const tokenRole = decodeTokenRole(token)
    if (tokenRole === 'admin' || tokenRole === 'student') {
      localStorage.setItem('role', tokenRole)
      setRole(tokenRole)
      return
    }

    setRole('student')
  }, [navigate])

  useEffect(() => {
    if (role !== 'admin') return
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchAdminAnalytics = async () => {
      setIsLoadingAdminAnalytics(true)
      setAdminAnalyticsError('')
      try {
        const response = await fetch(`${serverUrl}/admin/analytics/overview`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()

        if (!response.ok) {
          setAdminAnalyticsError(data.error || 'Failed to load admin analytics')
          return
        }

        setAdminAnalytics({
          salesByDay: data.salesByDay || [],
          popularItems: data.popularItems || [],
          ordersPerHour: data.ordersPerHour || [],
        })
      } catch {
        setAdminAnalyticsError('Unable to connect to server')
      } finally {
        setIsLoadingAdminAnalytics(false)
      }
    }

    fetchAdminAnalytics()
  }, [role, serverUrl])

  const heatmapMaxOrders = useMemo(() => {
    return Math.max(1, ...adminAnalytics.ordersPerHour.map((entry) => entry.totalOrders || 0))
  }, [adminAnalytics.ordersPerHour])

  const maxDailySales = useMemo(() => {
    return Math.max(1, ...adminAnalytics.salesByDay.map((entry) => entry.totalSales || 0))
  }, [adminAnalytics.salesByDay])

  const pieChartData = useMemo(() => {
    const total = adminAnalytics.popularItems.reduce((sum, item) => sum + (item.totalOrdered || 0), 0)
    if (!total) return []

    let cursor = 0
    return adminAnalytics.popularItems.map((item, index) => {
      const value = item.totalOrdered || 0
      const percentage = (value / total) * 100
      const start = cursor
      const end = cursor + percentage
      cursor = end

      return {
        ...item,
        percentage,
        start,
        end,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }
    })
  }, [adminAnalytics.popularItems])

  const pieConicGradient = useMemo(() => {
    if (pieChartData.length === 0) return '#dbeafe'
    return `conic-gradient(${pieChartData
      .map((segment) => `${segment.color} ${segment.start.toFixed(2)}% ${segment.end.toFixed(2)}%`)
      .join(', ')})`
  }, [pieChartData])

  useEffect(() => {
    if (role !== 'student') return
    const token = localStorage.getItem('token')
    if (!token) return

    const fetchDashboardData = async () => {
      setIsLoadingProducts(true)
      setDashboardError('')
      try {
        const [frequentRes, menuRes] = await Promise.all([
          fetch(`${serverUrl}/student/frequent-orders`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${serverUrl}/student/menu`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const frequentData = await frequentRes.json()
        const menuData = await menuRes.json()

        if (!frequentRes.ok) {
          setDashboardError(frequentData.error || 'Failed to load frequent orders')
        } else {
          setFrequentOrders(frequentData)
        }

        if (!menuRes.ok) {
          setDashboardError(menuData.error || 'Failed to load products')
        } else {
          setProducts(menuData.products || [])
        }
      } catch {
        setDashboardError('Unable to connect to server')
      } finally {
        setIsLoadingProducts(false)
      }
    }

    fetchDashboardData()
  }, [role, serverUrl])

  const visibleProducts = useMemo(() => {
    return products.filter((item) => {
      const categoryOk = categoryFilter === 'all' || item.category === categoryFilter
      const dietOk = dietFilter === 'all' || item.type === dietFilter
      return categoryOk && dietOk
    })
  }, [products, categoryFilter, dietFilter])

  const handleQuickReorder = async (productId) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const response = await fetch(`${serverUrl}/student/reorder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      })
      const data = await response.json()
      if (!response.ok) {
        setDashboardError(data.error || 'Failed to reorder')
        return
      }
      navigate('/cart')
    } catch {
      setDashboardError('Unable to connect to server')
    }
  }

  const handleAddToCart = async (productId) => {
    const token = localStorage.getItem('token')
    if (!token) return
    setAddingProductId(productId)
    try {
      const response = await fetch(`${serverUrl}/student/cart/items`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      const data = await response.json()
      if (!response.ok) {
        setDashboardError(data.error || 'Failed to add product to cart')
      }
    } catch {
      setDashboardError('Unable to connect to server')
    } finally {
      setAddingProductId('')
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-shell">
        <div className="dashboard-card">
          <h1>{role === 'admin' ? 'Admin dashboard ready' : 'Student dashboard ready'}</h1>
          <p>
            {role === 'admin'
              ? 'Use analytics below to optimize operations, stocking, and staffing.'
              : 'Browse menu below, add products to cart, then checkout from Cart.'}
          </p>

          {role === 'admin' && (
            <div className="admin-analytics-section">
              {adminAnalyticsError && <p className="frequent-error">{adminAnalyticsError}</p>}
              {isLoadingAdminAnalytics ? (
                <p className="frequent-empty">Loading analytics...</p>
              ) : (
                <div className="admin-analytics-grid">
                  <div className="analytics-card">
                    <h3>Sales Overview</h3>
                    <p>Total Sales vs Day of Week</p>
                    <div className="sales-bars">
                      {adminAnalytics.salesByDay.map((entry) => {
                        const ratio = (entry.totalSales || 0) / maxDailySales
                        return (
                          <div key={entry.day} className="sales-bar-item" title={`${entry.day}: Rs ${Number(entry.totalSales || 0).toFixed(2)}`}>
                            <div className="sales-bar-track">
                              <div
                                className="sales-bar-fill"
                                style={{ height: `${Math.max(6, ratio * 100)}%` }}
                              />
                            </div>
                            <span className="sales-bar-day">{entry.day.slice(0, 3)}</span>
                            <small className="sales-bar-value">Rs {Number(entry.totalSales || 0).toFixed(0)}</small>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="analytics-card">
                    <h3>Popularity Graph</h3>
                    <p>Most ordered items</p>
                    <div className="pie-layout">
                      <div className="pie-visual" style={{ background: pieConicGradient }}>
                        <div className="pie-center" />
                      </div>
                      <div className="pie-legend">
                        {pieChartData.length === 0 ? (
                          <p className="frequent-empty">No item data yet.</p>
                        ) : (
                          pieChartData.map((item) => (
                            <div key={item.productId || item.name} className="pie-legend-item">
                              <span className="pie-color" style={{ background: item.color }} />
                              <span className="pie-name">{item.name}</span>
                              <strong className="pie-value">{item.totalOrdered}</strong>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="analytics-card analytics-card-wide">
                    <h3>Peak Hour Heatmap</h3>
                    <p>Orders per hour (darker = busier)</p>
                    <div className="hour-heatmap-grid">
                      {adminAnalytics.ordersPerHour.map((slot) => {
                        const intensity = (slot.totalOrders || 0) / heatmapMaxOrders
                        return (
                          <div
                            key={slot.hour}
                            className="hour-heat-cell"
                            style={{
                              background: `rgba(37, 99, 235, ${0.18 + intensity * 0.72})`,
                            }}
                            title={`${slot.label} - ${slot.totalOrders} orders`}
                          >
                            <span>{slot.label}</span>
                            <strong>{slot.totalOrders}</strong>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {role === 'student' && (
            <>
              <div className="frequent-section">
                <h3>Frequent Orders</h3>
                {dashboardError && <p className="frequent-error">{dashboardError}</p>}
                {frequentOrders.length === 0 ? (
                  <p className="frequent-empty">No frequent orders yet.</p>
                ) : (
                  <div className="frequent-grid">
                    {frequentOrders.map((item) => (
                      <div key={item.productId} className="frequent-item">
                        <p>{item.name}</p>
                        <small>Ordered {item.count} times</small>
                        <button type="button" onClick={() => handleQuickReorder(item.productId)}>
                          Re-order
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="student-menu-section">
                <div className="menu-filters">
                  <div className="menu-filter-group">
                    {['all', 'breakfast', 'lunch', 'snacks', 'drinks'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={categoryFilter === cat ? 'active' : ''}
                        onClick={() => setCategoryFilter(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="menu-filter-group">
                    {['all', 'veg', 'non-veg'].map((diet) => (
                      <button
                        key={diet}
                        type="button"
                        className={dietFilter === diet ? 'active' : ''}
                        onClick={() => setDietFilter(diet)}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                </div>

                {isLoadingProducts ? (
                  <p className="frequent-empty">Loading products...</p>
                ) : (
                  <div className="student-menu-grid">
                    {visibleProducts.map((item) => (
                      <div key={item._id} className="student-menu-card">
                        <img
                          src={item.image?.[0] || 'https://via.placeholder.com/140x100?text=Food'}
                          alt={item.name}
                        />
                        <h4>{item.name}</h4>
                        <p>{item.category} | {item.type}</p>
                        <p className="student-menu-price">Rs {Number(item.price || 0).toFixed(2)}</p>
                        <button
                          type="button"
                          disabled={Number(item.totalStocks || 0) <= 0 || addingProductId === item._id}
                          onClick={() => handleAddToCart(item._id)}
                        >
                          {Number(item.totalStocks || 0) <= 0
                            ? 'Out of Stock'
                            : addingProductId === item._id
                              ? 'Adding...'
                              : 'Add to Cart'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
