import { useCallback, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import * as preferencesService from '../services/preferencesService'
import { useAuth } from '../context/AuthContext'
import { applyTheme } from '../utils/theme'

const TIMEZONES = [
  'UTC',
  'Africa/Addis_Ababa',
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo'
]

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()
  const [prefs, setPrefs] = useState(null)
  const [profile, setProfile] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [error, setError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [saved, setSaved] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await preferencesService.fetchPreferences()
      setPrefs(data)
      applyTheme(data.theme)
    } catch (e) {
      setError(e.message || 'Could not load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!user) return
    setProfile({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || ''
    })
  }, [user])

  const handlePrefChange = (field, value) => {
    setPrefs((p) => (p ? { ...p, [field]: value } : p))
    setSaved(false)
  }

  const handleProfileChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }))
    setProfileSaved(false)
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError('')
    setProfileSaved(false)
    try {
      await authService.patchProfile({
        username: profile.username.trim(),
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone
      })
      await refreshUser()
      setProfileSaved(true)
    } catch (err) {
      setProfileError(err.message || 'Could not save profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePrefsSubmit = async (e) => {
    e.preventDefault()
    if (!prefs) return
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const updated = await preferencesService.patchPreferences({
        theme: prefs.theme,
        timezone: prefs.timezone,
        language: prefs.language,
        email_notifications: prefs.email_notifications
      })
      setPrefs(updated)
      applyTheme(updated.theme)
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !prefs) {
    return (
      <section className="dashboard-panel">
        <h1>Settings</h1>
        <p className="muted-text">{loading ? 'Loading…' : '—'}</p>
      </section>
    )
  }

  return (
    <section className="dashboard-panel settings-page">
      <h1>Settings</h1>
      <p className="muted-text">Profile, appearance, locale, and notification defaults.</p>

      <h2 className="settings-section-title">Profile</h2>
      <p className="muted-text settings-section-hint">
        How you appear in the app. New Google accounts use your email and name automatically; you can
        refine them here.
      </p>
      {profileError && <p className="error-message">{profileError}</p>}
      {profileSaved && <p className="settings-saved">Profile saved.</p>}
      <form className="settings-form" onSubmit={handleProfileSubmit}>
        <label>
          Email
          <input type="text" value={user?.email || ''} readOnly disabled className="settings-readonly" />
        </label>
        <label>
          Username
          <input
            type="text"
            value={profile.username}
            onChange={(e) => handleProfileChange('username', e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          First name
          <input
            type="text"
            value={profile.first_name}
            onChange={(e) => handleProfileChange('first_name', e.target.value)}
            autoComplete="given-name"
          />
        </label>
        <label>
          Last name
          <input
            type="text"
            value={profile.last_name}
            onChange={(e) => handleProfileChange('last_name', e.target.value)}
            autoComplete="family-name"
          />
        </label>
        <label>
          Phone
          <input
            type="text"
            value={profile.phone}
            onChange={(e) => handleProfileChange('phone', e.target.value)}
            autoComplete="tel"
          />
        </label>
        <button type="submit" disabled={profileSaving}>
          {profileSaving ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <h2 className="settings-section-title">Preferences</h2>
      {error && <p className="error-message">{error}</p>}
      {saved && <p className="settings-saved">Preferences saved.</p>}
      <form className="settings-form" onSubmit={handlePrefsSubmit}>
        <label>
          Theme
          <select
            value={prefs.theme}
            onChange={(e) => handlePrefChange('theme', e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Timezone
          <select
            value={prefs.timezone}
            onChange={(e) => handlePrefChange('timezone', e.target.value)}
          >
            {[...new Set([prefs.timezone, ...TIMEZONES].filter(Boolean))].map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label>
          Language
          <select
            value={prefs.language}
            onChange={(e) => handlePrefChange('language', e.target.value)}
          >
            <option value="en">English</option>
            <option value="am">Amharic (beta)</option>
          </select>
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={prefs.email_notifications}
            onChange={(e) => handlePrefChange('email_notifications', e.target.checked)}
          />
          Email notifications (for future alerts)
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </section>
  )
}
