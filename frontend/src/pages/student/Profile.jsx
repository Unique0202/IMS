import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../utils/api'

function StatCard({ label, value, tone }) {
  const tones = {
    cyan:    'bg-cyan-50 border-cyan-100 text-cyan-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    blue:    'bg-blue-50 border-blue-100 text-blue-700',
    slate:   'bg-slate-50 border-slate-100 text-slate-600',
  }
  return (
    <div className={`rounded-2xl border p-4 text-center ${tones[tone] || tones.slate}`}>
      <p className="text-2xl font-bold font-heading">{value}</p>
      <p className="text-xs font-body mt-1 opacity-75">{label}</p>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const [requests, setRequests]   = useState([])
  const [loadingStats, setLoadingStats] = useState(true)

  // Change password form
  const [pwForm, setPwForm]       = useState({ current: '', next: '', confirm: '' })
  const [pwError, setPwError]     = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    api.get('/api/requests/mine')
      .then((res) => { if (res.data.success) setRequests(res.data.data.requests) })
      .finally(() => setLoadingStats(false))
  }, [])

  const stats = {
    total:    requests.length,
    active:   requests.filter((r) => ['PENDING', 'APPROVED'].includes(r.status)).length,
    issued:   requests.filter((r) => r.status === 'ISSUED').length,
    returned: requests.filter((r) => r.status === 'RETURNED').length,
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError('All fields are required'); return
    }
    if (pwForm.next.length < 6) {
      setPwError('New password must be at least 6 characters'); return
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match'); return
    }

    setPwLoading(true)
    try {
      await api.patch('/api/auth/change-password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      })
      setPwSuccess(true)
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setPwError(err.response?.data?.error?.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-heading">My Profile</h1>
        <p className="text-slate-500 mt-1 font-body text-sm">Manage your account details</p>
      </div>

      {/* Identity card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 text-2xl font-bold font-heading flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 font-heading">{user?.name}</p>
            <p className="text-sm text-slate-500 font-body">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-body font-medium">
                {user?.role}
              </span>
              {joinedDate && (
                <span className="text-xs text-slate-400 font-body">Member since {joinedDate}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {!loadingStats && (
        <div className="grid grid-cols-4 gap-3">
          <StatCard label="Total Requests" value={stats.total}    tone="slate"   />
          <StatCard label="Pending/Approved" value={stats.active}  tone="cyan"    />
          <StatCard label="Currently Issued" value={stats.issued}  tone="blue"    />
          <StatCard label="Returned"         value={stats.returned} tone="emerald" />
        </div>
      )}

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 font-heading mb-4">Change Password</h2>

        <form onSubmit={handlePasswordChange} className="space-y-3">
          {[
            { label: 'Current Password', field: 'current', placeholder: 'Enter current password' },
            { label: 'New Password',     field: 'next',    placeholder: 'At least 6 characters' },
            { label: 'Confirm New Password', field: 'confirm', placeholder: 'Re-enter new password' },
          ].map(({ label, field, placeholder }) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-slate-700 font-body mb-1.5 uppercase tracking-wider">
                {label}
              </label>
              <input
                type="password"
                value={pwForm[field]}
                onChange={(e) => { setPwForm((f) => ({ ...f, [field]: e.target.value })); setPwError(''); setPwSuccess(false) }}
                placeholder={placeholder}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 font-body focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          ))}

          {pwError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-xs text-red-700 font-body">{pwError}</p>
            </div>
          )}
          {pwSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
              <p className="text-xs text-emerald-700 font-body font-medium">Password changed successfully!</p>
            </div>
          )}

          <button
            type="submit"
            disabled={pwLoading}
            className="w-full py-2.5 text-sm rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 font-semibold font-body cursor-pointer transition-colors disabled:opacity-60 mt-2"
          >
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
