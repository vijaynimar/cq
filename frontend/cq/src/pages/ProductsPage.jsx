import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/ProductsPage.css'

function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    totalStocks: '',
    price: '',
    type: 'veg',
  })
  const [imageFiles, setImageFiles] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [carouselIndex, setCarouselIndex] = useState({})
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'admin') {
      navigate('/login')
      return
    }
    fetchProducts()
  }, [navigate, serverUrl])

  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => {
        const newIndex = { ...prev }
        products.forEach((product) => {
          if (product.image && product.image.length > 0) {
            newIndex[product._id] = ((newIndex[product._id] || 0) + 1) % product.image.length
          }
        })
        return newIndex
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [products])

  const fetchProducts = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/admin/products`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to load products')
        return
      }
      setProducts(data)
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setImageFiles(files)
    const previews = files.map((file) => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData({ name: '', totalStocks: '', price: '', type: 'veg' })
    setImageFiles([])
    setImagePreviews([])
    setEditingProduct(null)
    setShowAddModal(false)
  }

  const handleAddProduct = async () => {
    if (!formData.name || !formData.totalStocks || !formData.price) {
      setError('Please fill in all required fields')
      return
    }

    const token = localStorage.getItem('token')
    const data = new FormData()
    data.append('name', formData.name)
    data.append('totalStocks', formData.totalStocks)
    data.append('price', formData.price)
    data.append('type', formData.type)

    imageFiles.forEach((file) => {
      data.append('photos', file)
    })

    try {
      const response = await fetch(`${serverUrl}/admin/addProduct`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Failed to add product')
        return
      }

      setProducts([...products, result])
      resetForm()
      setError('')
    } catch {
      setError('Unable to connect to server')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      totalStocks: product.totalStocks,
      price: product.price,
      type: product.type,
    })
    setImageFiles([])
    setImagePreviews(product.image || [])
    setShowAddModal(true)
  }

  const handleUpdateProduct = async () => {
    if (!formData.name || !formData.totalStocks || !formData.price) {
      setError('Please fill in all required fields')
      return
    }

    const token = localStorage.getItem('token')
    const data = new FormData()
    data.append('name', formData.name)
    data.append('totalStocks', formData.totalStocks)
    data.append('price', formData.price)
    data.append('type', formData.type)

    imageFiles.forEach((file) => {
      data.append('photos', file)
    })

    try {
      const response = await fetch(`${serverUrl}/admin/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Failed to update product')
        return
      }

      setProducts(products.map((p) => (p._id === editingProduct._id ? result : p)))
      resetForm()
      setError('')
    } catch {
      setError('Unable to connect to server')
    }
  }

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return

    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${serverUrl}/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to delete product')
        return
      }

      setProducts(products.filter((p) => p._id !== productId))
      setError('')
    } catch {
      setError('Unable to connect to server')
    }
  }

  return (
    <div className="products-container">
      <div className="products-header">
        <h1>Products Management</h1>
        <button className="add-product-btn" onClick={() => { resetForm(); setShowAddModal(true); }}>
          + Add Product
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <p className="loading">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="no-products">No products found. Create your first product!</p>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <div key={product._id} className="product-card">
              <div className="product-carousel">
                {product.image && product.image.length > 0 ? (
                  <>
                    <img
                      src={product.image[carouselIndex[product._id] || 0]}
                      alt={product.name}
                      className="product-image"
                    />
                    {product.image.length > 1 && (
                      <div className="carousel-dots">
                        {product.image.map((_, idx) => (
                          <span
                            key={idx}
                            className={`dot ${idx === (carouselIndex[product._id] || 0) ? 'active' : ''}`}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <img src="https://via.placeholder.com/200x200?text=No+Image" alt="No image" className="product-image" />
                )}
              </div>

              <div className="product-info">
                <h3>{product.name}</h3>
                <p className="product-type">{product.type}</p>
                <p className="product-price">₹{product.price}</p>
                <p className="product-stock">Stock: {product.totalStocks}</p>

                <div className="product-actions">
                  <button className="edit-btn" onClick={() => handleEditProduct(product)}>
                    Edit
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteProduct(product._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>

            <form>
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter product name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="totalStocks"
                    value={formData.totalStocks}
                    onChange={handleInputChange}
                    placeholder="Enter stock"
                  />
                </div>

                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Type</label>
                <select name="type" value={formData.type} onChange={handleInputChange}>
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                </select>
              </div>

              <div className="form-group">
                <label>Images (Multiple allowed)</label>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="image-preview-grid">
                {imagePreviews.map((preview, idx) => (
                  <img key={idx} src={preview} alt={`Preview ${idx}`} className="preview-image" />
                ))}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="save-btn"
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                >
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsPage
