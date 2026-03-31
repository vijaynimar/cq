import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/DashboardPage.css'

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
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dietFilter, setDietFilter] = useState('all')
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const navItems = useMemo(() => {
    if (role === 'admin') {
      return [
        { label: 'Profile', icon: 'P' },
        { label: 'Products', icon: 'PR' },
        { label: 'Students', icon: 'ST' },
        { label: 'Orders', icon: 'OR' },
        { label: 'Support', icon: 'SP' },
      ]
    }

    return [
      { label: 'Profile', icon: 'P' },
      { label: 'Cart', icon: 'C' },
      { label: 'Wallet', icon: 'W' },
      { label: 'Payment', icon: 'PY' },
      { label: 'Orders', icon: 'OR' },
      { label: 'Support', icon: 'SP' },
    ]
  }, [role])

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

  const handleNavClick = (label) => {
    if (label === 'Profile') {
      navigate('/profile')
    } else if (label === 'Products') {
      navigate('/products')
    } else if (label === 'Students') {
      navigate('/students')
    } else if (label === 'Cart') {
      navigate('/cart')
    } else if (label === 'Orders') {
      navigate('/orders')
    } else if (label === 'Wallet') {
      navigate('/wallet')
    } else if (label === 'Payment') {
      navigate('/payment')
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-shell">
        <nav className="dashboard-navbar">
          <div className="navbar-left">
            <span className={`role-pill ${role}`}>{role === 'admin' ? 'Role: Admin' : 'Role: Student'}</span>
          </div>
          <div className="navbar-right">
            {[...navItems].reverse().map((item) => (
              <button
                type="button"
                key={item.label}
                className="nav-action"
                onClick={() => handleNavClick(item.label)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="dashboard-card">
          <h1>{role === 'admin' ? 'Admin dashboard ready' : 'Student dashboard ready'}</h1>
          <p>
            {role === 'admin'
              ? 'Manage products, students, and orders from the top navigation.'
              : 'Browse menu below, add products to cart, then checkout from Cart.'}
          </p>

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
