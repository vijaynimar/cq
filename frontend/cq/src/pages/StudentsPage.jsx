import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/StudentsPage.css'

function StudentsPage() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingStudent, setEditingStudent] = useState(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    walletMoney: 0,
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const serverUrl = import.meta.env.serverUrl || import.meta.env.VITE_SERVER_URL

  const fetchStudents = async () => {
    setIsLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/admin/students`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to fetch students')
        return
      }
      setStudents(data)
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!token || role !== 'admin') {
      navigate('/login')
      return
    }
    fetchStudents()
  }, [navigate, serverUrl])

  const openEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      walletMoney: Number(student.walletMoney || 0),
    })
    setImageFile(null)
    setImagePreview(student.image || '')
  }

  const closeEdit = () => {
    setEditingStudent(null)
    setFormData({ firstName: '', lastName: '', walletMoney: 0 })
    setImageFile(null)
    setImagePreview('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleUpdate = async () => {
    if (!editingStudent) return
    setIsSubmitting(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const data = new FormData()
      data.append('firstName', formData.firstName)
      data.append('lastName', formData.lastName)
      data.append('walletMoney', String(Number(formData.walletMoney || 0)))
      if (imageFile) {
        data.append('image', imageFile)
      }

      const response = await fetch(`${serverUrl}/admin/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Failed to update student')
        return
      }

      setStudents((prev) => prev.map((s) => (s._id === editingStudent._id ? result : s)))
      closeEdit()
    } catch {
      setError('Unable to connect to server')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (studentId) => {
    const confirmDelete = window.confirm('Delete this student?')
    if (!confirmDelete) return

    setError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${serverUrl}/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Failed to delete student')
        return
      }
      setStudents((prev) => prev.filter((s) => s._id !== studentId))
    } catch {
      setError('Unable to connect to server')
    }
  }

  return (
    <div className="students-page">
      <div className="students-shell">
        <div className="students-topbar">
          <h1>Students Management</h1>
          <button className="students-dashboard-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        {error && <p className="students-error">{error}</p>}

        {isLoading ? (
          <p className="students-loading">Loading students...</p>
        ) : (
          <div className="students-grid">
            {students.map((student) => (
              <div className="student-card" key={student._id}>
                <img
                  className="student-avatar"
                  src={student.image || 'https://via.placeholder.com/120x120?text=Student'}
                  alt={student.firstName || 'Student'}
                />
                <h3>{[student.firstName, student.lastName].filter(Boolean).join(' ') || 'Unnamed Student'}</h3>
                <p><strong>Email:</strong> {student.email || '-'}</p>
                <p><strong>Phone:</strong> {student.phone || '-'}</p>
                <p><strong>Wallet:</strong> Rs {Number(student.walletMoney || 0).toFixed(2)}</p>

                <div className="student-actions">
                  <button className="student-edit-btn" onClick={() => openEdit(student)}>Edit</button>
                  <button className="student-delete-btn" onClick={() => handleDelete(student._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingStudent && (
        <div className="students-modal-overlay">
          <div className="students-modal">
            <h2>Edit Student</h2>
            <p className="students-note">Role, Password, Email and Phone are not editable by admin.</p>

            <label>First Name</label>
            <input name="firstName" value={formData.firstName} onChange={handleInputChange} />

            <label>Last Name</label>
            <input name="lastName" value={formData.lastName} onChange={handleInputChange} />

            <label>Wallet Money</label>
            <input name="walletMoney" type="number" value={formData.walletMoney} onChange={handleInputChange} />

            <label>Image URL</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Student preview"
                className="student-avatar"
                style={{ width: '80px', height: '80px', marginTop: '8px' }}
              />
            )}

            <div className="students-modal-actions">
              <button className="students-save-btn" onClick={handleUpdate} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="students-cancel-btn" onClick={closeEdit} disabled={isSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentsPage
