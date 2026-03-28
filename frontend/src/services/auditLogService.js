import { apiFetch } from '../api/client'

export async function fetchAuditLogs(page = 1) {
  const response = await apiFetch(`/api/audit-logs/?page=${page}`)
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to load activity log')
  }
  return response.json()
}
