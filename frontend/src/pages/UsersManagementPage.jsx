import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import * as usersService from '../services/usersService'

const ROLE_OPTIONS = [
  { value: 'superadmin', label: 'Super admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'customer', label: 'Customer' }
]

function rolesForManager(currentUser) {
  if (currentUser?.role === 'superadmin') return ROLE_OPTIONS
  return ROLE_OPTIONS.filter((r) => ['staff', 'customer'].includes(r.value))
}

const emptyForm = {
  username: '',
  password: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'customer',
  is_active: true
}

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function canManageUsers(user) {
  return user?.role === 'superadmin' || user?.role === 'admin'
}

export default function UsersManagementPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [creating, setCreating] = useState(false)
  const [rowBusy, setRowBusy] = useState({})

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await usersService.fetchUsers()
      setUsers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || 'Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (canManageUsers(currentUser)) {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [currentUser, loadUsers])

  const setBusy = (id, key, value) => {
    setRowBusy((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value }
    }))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const payload = {
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        role: form.role,
        is_active: form.is_active
      }
      await usersService.createUser(payload)
      setForm(emptyForm)
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Could not create user')
    } finally {
      setCreating(false)
    }
  }

  const handleRoleChange = async (row, newRole) => {
    setBusy(row.id, 'role', true)
    try {
      await usersService.patchUser(row.id, { role: newRole })
      setUsers((prev) =>
        prev.map((u) => (u.id === row.id ? { ...u, role: newRole } : u))
      )
    } catch (err) {
      setError(err.message || 'Could not update role')
    } finally {
      setBusy(row.id, 'role', false)
    }
  }

  const handleActiveToggle = async (row, isActive) => {
    setBusy(row.id, 'active', true)
    try {
      await usersService.patchUser(row.id, { is_active: isActive })
      setUsers((prev) =>
        prev.map((u) => (u.id === row.id ? { ...u, is_active: isActive } : u))
      )
    } catch (err) {
      setError(err.message || 'Could not update status')
    } finally {
      setBusy(row.id, 'active', false)
    }
  }

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `Remove user "${row.username}"? This cannot be undone.`
      )
    ) {
      return
    }
    setBusy(row.id, 'delete', true)
    try {
      await usersService.deleteUser(row.id)
      setUsers((prev) => prev.filter((u) => u.id !== row.id))
    } catch (err) {
      setError(err.message || 'Could not delete user')
    } finally {
      setBusy(row.id, 'delete', false)
    }
  }

  if (!canManageUsers(currentUser)) {
    return <Navigate to="/dashboard" replace />
  }

  const roleSelectOptions = rolesForManager(currentUser)

  return (
    <section className="dashboard-panel users-management">
      <div className="users-management-header">
        <div>
          <h1>Users management</h1>
          <p className="muted-text">
            Super admins manage every account including admins. Admins create and approve staff and
            customer accounts (activate or suspend access below).
          </p>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={loadUsers}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="error-message" style={{ marginBottom: 16 }}>
          {error}
        </p>
      )}

      <div className="users-grid">
        <form className="user-create-card" onSubmit={handleCreate}>
          <h2>Create user</h2>
          <div className="form-grid">
            <label>
              Username *
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                required
                autoComplete="off"
              />
            </label>
            <label>
              Password * (min 8)
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                autoComplete="off"
              />
            </label>
            <label>
              First name
              <input
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
              />
            </label>
            <label>
              Last name
              <input
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
              />
            </label>
            <label>
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label>
              Role *
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              >
                {roleSelectOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Active account (approved)
            </label>
          </div>
          <button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create user'}
          </button>
        </form>

        <div className="users-table-wrap">
          <h2>All users</h2>
          {loading ? (
            <p className="muted-text">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="muted-text">No users found.</p>
          ) : (
            <div className="table-scroll">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Active</th>
                    <th>Joined</th>
                    <th>Last login</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => {
                    const busy = rowBusy[row.id] || {}
                    const isSelf = row.id === currentUser?.id
                    return (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.username}</strong>
                          {row.is_superuser && (
                            <span className="badge badge-super">django superuser</span>
                          )}
                        </td>
                        <td>{row.email || '—'}</td>
                        <td>
                          {[row.first_name, row.last_name].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td>{row.phone || '—'}</td>
                        <td>
                          <select
                            value={row.role}
                            disabled={busy.role}
                            onChange={(e) => handleRoleChange(row, e.target.value)}
                          >
                            {roleSelectOptions.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <label className="toggle-cell">
                            <input
                              type="checkbox"
                              checked={row.is_active}
                              disabled={busy.active || isSelf}
                              onChange={(e) => handleActiveToggle(row, e.target.checked)}
                              title={isSelf ? 'Cannot suspend your own session here' : ''}
                            />
                            <span>{row.is_active ? 'Active' : 'Suspended'}</span>
                          </label>
                        </td>
                        <td className="nowrap">{formatDate(row.date_joined)}</td>
                        <td className="nowrap">{formatDate(row.last_login)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={busy.delete || isSelf}
                            onClick={() => handleDelete(row)}
                            title={isSelf ? 'Cannot delete yourself' : 'Remove user'}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
