import { Link } from 'react-router-dom'

/**
 * Admin Dashboard — the first page an admin sees after login.
 *
 * DUMMY DATA (Phase 3):
 *   All numbers below are hardcoded. In Phase 7, the pending request count,
 *   approve/decline buttons, and low stock alerts become real.
 *
 * LAYOUT:
 *   - Greeting
 *   - 4 stat cards
 *   - Two columns: Pending Requests (left) + Low Stock Alerts (right)
 */

const stats = [
  { label: 'Pending Requests', value: 5, icon: '📋', color: 'bg-amber-50 text-amber-700' },
  { label: 'Total Items', value: 105, icon: '📦', color: 'bg-blue-50 text-blue-700' },
  { label: 'Currently Issued', value: 12, icon: '🔄', color: 'bg-green-50 text-green-700' },
  { label: 'Low Stock Alerts', value: 3, icon: '⚠️', color: 'bg-red-50 text-red-700' },
]

const pendingRequests = [
  { id: 1, student: 'Harsh Kumar', items: 'Arduino UNO x2', time: '2 hours ago' },
  { id: 2, student: 'Bhawani Singh', items: 'DHT11 x3, Jumper Wires x20', time: '5 hours ago' },
  { id: 3, student: 'Abhinav Gupta', items: 'ESP32 x1', time: 'Yesterday' },
]

const lowStockItems = [
  { id: 1, name: 'ICM0C3021', left: 1, severity: 'red' },
  { id: 2, name: 'LoRA Module', left: 2, severity: 'orange' },
  { id: 3, name: 'Analog PH Sensor', left: 2, severity: 'orange' },
]

function AdminDashboard() {
  return (
    <div>
      {/* Greeting */}
      <h1 className="font-heading text-2xl font-bold text-gray-900 mb-6">
        Welcome back, Admin 👋
      </h1>

      {/* Demo data notice */}
      <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-lg px-3 py-2 font-body">
        Demo data — real numbers come in Phase 7+
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
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Pending Requests */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-gray-900">Pending Requests</h2>
            <Link to="/admin/requests" className="text-sm text-blue-600 hover:text-blue-700 font-medium font-body">
              View all →
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 font-body">{req.student}</p>
                    <p className="text-sm text-gray-600 font-body mt-0.5">{req.items}</p>
                    <p className="text-xs text-gray-400 mt-1 font-body">{req.time}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-1.5 px-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold font-body hover:bg-green-100 transition-colors cursor-pointer"
                    onClick={() => alert('Approve functionality coming in Phase 7!')}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="flex-1 py-1.5 px-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold font-body hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={() => alert('Decline functionality coming in Phase 7!')}
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-gray-900">Low Stock Alerts</h2>
            <Link to="/admin/inventory" className="text-sm text-blue-600 hover:text-blue-700 font-medium font-body">
              View full inventory →
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {lowStockItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 font-body">{item.name}</p>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  item.severity === 'red'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  Only {item.left} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
