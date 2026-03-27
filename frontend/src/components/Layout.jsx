import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, ShieldAlert, Eye, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import LiveTickerTape from './LiveTickerTape'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Risk Analysis', path: '/risk', icon: ShieldAlert },
    { name: 'Watchlist', path: '/watchlist', icon: Eye },
  ]

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <LiveTickerTape />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col pt-4">
          <div className="px-6 mb-6">
            <h1 className="text-xl font-black tracking-tighter text-indigo-400">STOCK_PRO</h1>
          </div>
          
          <nav className="flex-1 px-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 text-sm rounded transition-colors ${
                    active 
                      ? 'bg-gray-800 text-indigo-400 font-semibold' 
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Account</span>
                <span className="text-sm font-medium text-gray-300 truncate w-32">{user?.name}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-200 transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto flex flex-col bg-[#0b0c10]">
          <header className="h-12 bg-gray-900 border-b border-gray-800 flex items-center px-6 sticky top-0 z-10 shadow-sm">
            <h2 className="text-base font-semibold text-gray-100 uppercase tracking-widest">
              {location.pathname.replace('/', '')}
            </h2>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
