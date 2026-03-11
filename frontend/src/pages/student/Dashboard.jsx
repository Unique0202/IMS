import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * Student Dashboard — the first page a student sees after login.
 *
 * DUMMY DATA (Phase 3):
 *   All numbers below are hardcoded. In Phase 5+, they get replaced with
 *   real API calls to fetch the student's actual data.
 *
 * LAYOUT:
 *   - Greeting with student name
 *   - 4 stat cards in a row
 *   - Two columns: Active Requests (left) + Items With Me (right)
 *   - "Browse Inventory" button at bottom
 */

// Dummy data — replaced with API calls in later phases
const stats = [
  { label: 'Active Requests', value: 2, icon: '📋', color: 'bg-blue-50 text-blue-700' },
  { label: 'Items With Me', value: 3, icon: '📦', color: 'bg-green-50 text-green-700' },
  { label: 'Total Issued', value: 7, icon: '✅', color: 'bg-purple-50 text-purple-700' },
  { label: 'Due Soon', value: 1, icon: '⏰', color: 'bg-amber-50 text-amber-700' },
]

const activeRequests = [
  {
    id: 1,
    items: 'Arduino UNO x2, ESP32 x1',
    status: 'PENDING',
    date: 'Today',
  },
  {
    id: 2,
    items: 'Multimeter x1',
    status: 'APPROVED',
    date: 'Collect by: Tomorrow 5pm',
  },
]

const issuedItems = [
  { id: 1, name: 'NodeMCU x1', due: '3 days left', overdue: false },
  { id: 2, name: 'Soldering Iron x1', due: 'OVERDUE', overdue: true },
]

const statusColors = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  DECLINED: 'bg-red-100 text-red-800',
  RETURNED: 'bg-gray-100 text-gray-600',
}

function StudentDashboard() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'Student'

  return (
    <div>
      {/* Greeting */}
      <h1 className="font-heading text-2xl font-bold text-gray-900 mb-6">
        Good morning, {firstName} 👋
      </h1>

      {/* Demo data notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-3 py-2 font-body">
        Demo data — real numbers come in Phase 5+
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 font-body mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Left: Active Requests */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-heading text-lg font-semibold text-gray-900">My Active Requests</h2>
          </div>
          <div className="p-5 space-y-3">
            {activeRequests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-body">{req.items}</p>
                    <p className="text-xs text-gray-500 mt-1 font-body">{req.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusColors[req.status]}`}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Items Currently With Me */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-heading text-lg font-semibold text-gray-900">Items Currently With Me</h2>
          </div>
          <div className="p-5 space-y-3">
            {issuedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 font-body">{item.name}</p>
                <div className="flex items-center gap-2">
                  {item.overdue && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.overdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.due}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Browse Inventory CTA */}
      <Link
        to="/student/inventory"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm font-body transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        Browse Inventory
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </Link>
    </div>
  )
}

export default StudentDashboard
