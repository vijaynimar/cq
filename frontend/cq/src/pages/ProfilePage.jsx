import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/ProfilePage.css'

function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [updatingField, setUpdatingField] = useState(null)
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    const fetchMe = async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch(`${serverUrl}/user/getMe`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to load profile')
          return
        }

        setUser(data)
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          walletMoney: data.walletMoney || '',
        })

        const normalizedRole = data?.role === 'admin' ? 'admin' : 'student'
        localStorage.setItem('role', normalizedRole)
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: data._id,
            email: data.email,
            role: normalizedRole,
          })
        )
      } catch {
        setError('Unable to connect to server')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMe()
  }, [navigate, serverUrl])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const isFieldChanged = (field) => {
    return formData[field] !== (user?.[field] || '')
  }

  const handleUpdateField = async (field) => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setUpdatingField(field)
    setError('')

    try {
      const data = new FormData()
      data.append(field, formData[field])

      const response = await fetch(`${serverUrl}/common/updateProfile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to update')
        return
      }

      setUser(result)
      setFormData((prev) => ({ ...prev, [field]: result[field] || '' }))
    } catch {
      setError('Unable to connect to server')
    } finally {
      setUpdatingField(null)
    }
  }

  const handleUpdateImage = async () => {
    if (!imageFile) return

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    setUpdatingField('image')
    setError('')

    try {
      const data = new FormData()
      data.append('image', imageFile)

      const response = await fetch(`${serverUrl}/common/updateProfile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to update image')
        return
      }

      setUser(result)
      setImageFile(null)
      setImagePreview(null)
    } catch {
      setError('Unable to connect to server')
    } finally {
      setUpdatingField(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('role')
    navigate('/login')
  }

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')

  return (
    <div className="profile-container">
      <div className="profile-shell">
        <div className="profile-topbar">
          <button type="button" className="back-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="profile-card">
          {isLoading ? (
            <p className="profile-status">Loading profile...</p>
          ) : error && !updatingField ? (
            <p className="profile-error">{error}</p>
          ) : (
            <div className="profile-content">
              <div className="profile-head">
                <div className="image-wrapper">
                  <img
                    src={imagePreview || user?.image || 'https://via.placeholder.com/120x120?text=User'}
                    alt="Profile"
                    className="profile-image"
                  />
                  <label className="image-upload-label">
                    {imageFile ? 'Change' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {imageFile && (
                    <button
                      type="button"
                      className="update-image-btn"
                      onClick={handleUpdateImage}
                      disabled={updatingField === 'image'}
                    >
                      {updatingField === 'image' ? 'Updating...' : 'Update'}
                    </button>
                  )}
                </div>
                <div className="profile-title-wrap">
                  <h1>{fullName || 'Unnamed User'}</h1>
                  <p className="profile-role">{user?.role || 'student'}</p>
                </div>
              </div>

              <div className="editable-fields">
                <div className="field-group">
                  <label>First Name</label>
                  <div className="field-input-wrapper">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFieldChange}
                      placeholder="First name"
                    />
                    {isFieldChanged('firstName') && (
                      <button
                        type="button"
                        className="update-field-btn"
                        onClick={() => handleUpdateField('firstName')}
                        disabled={updatingField === 'firstName'}
                      >
                        {updatingField === 'firstName' ? 'Updating...' : 'Update'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="field-group">
                  <label>Last Name</label>
                  <div className="field-input-wrapper">
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFieldChange}
                      placeholder="Last name"
                    />
                    {isFieldChanged('lastName') && (
                      <button
                        type="button"
                        className="update-field-btn"
                        onClick={() => handleUpdateField('lastName')}
                        disabled={updatingField === 'lastName'}
                      >
                        {updatingField === 'lastName' ? 'Updating...' : 'Update'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="readonly-group">
                  <label>Email</label>
                  <p className="readonly-value">{user?.email || '-'}</p>
                </div>

                <div className="readonly-group">
                  <label>Phone</label>
                  <p className="readonly-value">{user?.phone || '-'}</p>
                </div>

                <div className="field-group">
                  <label>Wallet Money</label>
                  <div className="field-input-wrapper">
                    <input
                      type="text"
                      name="walletMoney"
                      value={formData.walletMoney}
                      onChange={handleFieldChange}
                      placeholder="Wallet money"
                    />
                    {isFieldChanged('walletMoney') && (
                      <button
                        type="button"
                        className="update-field-btn"
                        onClick={() => handleUpdateField('walletMoney')}
                        disabled={updatingField === 'walletMoney'}
                      >
                        {updatingField === 'walletMoney' ? 'Updating...' : 'Update'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="readonly-group">
                  <label>Role</label>
                  <p className="readonly-value">{user?.role || '-'}</p>
                </div>

                <div className="readonly-group">
                  <label>Created At</label>
                  <p className="readonly-value">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</p>
                </div>
              </div>

              <div className="profile-actions">
                <button type="button" className="logout-profile-btn" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
