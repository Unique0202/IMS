import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const stats = [
  { label: 'Active Requests', value: 2, tone: 'cyan', icon: 'requests' },
  { label: 'Items Issued', value: 3, tone: 'emerald', icon: 'issued' },
  { label: 'Completed Returns', value: 7, tone: 'slate', icon: 'returns' },
  { label: 'Due Soon', value: 1, tone: 'amber', icon: 'due' },
]

const activeRequests = [
  {
    id: 1,
    items: 'Arduino UNO x2, ESP32 x1',
    status: 'PENDING',
    date: 'Submitted today',
  },
  {
    id: 2,
    items: 'Multimeter x1',
    status: 'APPROVED',
    date: 'Collect by tomorrow, 5:00 PM',
  },
]

const issuedItems = [
  { id: 1, name: 'NodeMCU x1', due: 'Due in 3 days', overdue: false },
  { id: 2, name: 'Soldering Iron x1', due: 'Overdue', overdue: true },
]

const quickLinks = [
  {
    title: 'Browse Components',
    description: 'Check available devices and lab stock before placing a request.',
    to: '/student/inventory',
    icon: 'inventory',
  },
  {
    title: 'View Requests',
    description: 'Track approval status, collection windows, and request history.',
    to: '/student/requests',
    icon: 'requests',
  },
]

const statusColors = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ISSUED: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  DECLINED: 'bg-red-50 text-red-700 border-red-200',
  RETURNED: 'bg-slate-100 text-slate-600 border-slate-200',
}

const statTones = {
  cyan: {
    panel: 'bg-cyan-50 text-cyan-700 border-cyan-100',
    accent: 'bg-cyan-500',
  },
  emerald: {
    panel: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    accent: 'bg-emerald-500',
  },
  slate: {
    panel: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-slate-500',
  },
  amber: {
    panel: 'bg-amber-50 text-amber-700 border-amber-100',
    accent: 'bg-amber-500',
  },
}

function DashboardIcon({ type, className = 'w-5 h-5' }) {
  switch (type) {
    case 'requests':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 7h6m-6 4h4" />
        </svg>
      )
    case 'issued':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 8h10M7 12h10m-7 4h7M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />
        </svg>
      )
    case 'returns':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7h11m0 0l-4-4m4 4l-4 4M16 17H5m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    case 'due':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'inventory':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      )
    default:
      return null
  }
}

function StudentDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Student'

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-700 font-body">
              Student Dashboard
            </div>
            <h1 className="mt-4 font-heading text-3xl sm:text-4xl font-semibold text-slate-950">
              Welcome, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base leading-7 text-slate-600 font-body">
              Monitor your CIPD lab requests, issued equipment, and return deadlines from one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-body">Access</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 font-body">CIPD Electronics Lab</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 font-body">Status</p>
              <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 font-body">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Authorized Student
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-900 font-body">
          Demo data is shown here for now. Backend integration can replace these values without changing the layout.
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const tone = statTones[stat.tone]

          return (
            <div key={stat.label} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${tone.panel}`}>
                  <DashboardIcon type={stat.icon} className="h-5 w-5" />
                </div>
                <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tone.accent}`} />
              </div>
              <p className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500 font-body">{stat.label}</p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="font-heading text-xl font-semibold text-slate-950">Recent Requests</h2>
              <p className="mt-1 text-sm text-slate-500 font-body">Latest submissions and approval updates</p>
            </div>
            <Link to="/student/requests" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800 font-body">
              View all
            </Link>
          </div>

          <div className="space-y-4 p-6">
            {activeRequests.map((req) => (
              <div key={req.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                        <DashboardIcon type="requests" className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 font-body">{req.items}</p>
                        <p className="mt-1 text-xs text-slate-500 font-body">{req.date}</p>
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="font-heading text-xl font-semibold text-slate-950">Issued to You</h2>
              <p className="mt-1 text-sm text-slate-500 font-body">Items currently checked out under your account</p>
            </div>

            <div className="space-y-3 p-6">
              {issuedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 font-body">{item.name}</p>
                    <p className="mt-1 text-xs text-slate-500 font-body">Assigned through CIPD issue register</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    item.overdue ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {item.due}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-heading text-xl font-semibold text-slate-950">Quick Access</h2>
                <p className="mt-1 text-sm text-slate-500 font-body">Common student actions</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {quickLinks.map((item) => (
                <Link
                  key={item.title}
                  to={item.to}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4 transition-colors hover:border-cyan-200 hover:bg-cyan-50/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 group-hover:border-cyan-200 group-hover:text-cyan-700">
                      <DashboardIcon type={item.icon} className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 font-body">{item.title}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500 font-body">{item.description}</p>
                    </div>
                  </div>
                  <svg className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-cyan-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default StudentDashboard
