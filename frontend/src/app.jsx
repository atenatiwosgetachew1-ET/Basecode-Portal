'use client'

import { useState } from 'react'

export default function LoginPortal() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8000/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // important if using cookies/sessions
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setUsername('')
        setPassword('')
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Connection error. Make sure the backend is running on port 8000')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setUser(null)
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '400px', margin: '100px auto' }}>
      <h1>Login Portal</h1>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        {error && <div style={{ color: '#d32f2f', fontSize: '14px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '13px' }}>
        <p><strong>Demo Credentials:</strong></p>
        <p>• superuser / superadmin</p>
      </div>
    </div>
  )
}
