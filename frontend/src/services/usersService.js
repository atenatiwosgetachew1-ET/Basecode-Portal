import { apiFetch } from '../api/client'

export async function fetchUsers() {
  const response = await apiFetch('/api/users/')
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || err.message || 'Failed to load users')
  }
  return response.json()
}

export async function createUser(payload) {
  const response = await apiFetch('/api/users/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg =
      typeof data === 'object' && data !== null
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' ')
        : 'Failed to create user'
    throw new Error(msg || 'Failed to create user')
  }
  return data
}

export async function patchUser(id, payload) {
  const response = await apiFetch(`/api/users/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg =
      typeof data === 'object' && data !== null
        ? Object.entries(data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' ')
        : 'Failed to update user'
    throw new Error(msg || 'Failed to update user')
  }
  return data
}

export async function deleteUser(id) {
  const response = await apiFetch(`/api/users/${id}/`, { method: 'DELETE' })
  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Failed to delete user')
  }
}
