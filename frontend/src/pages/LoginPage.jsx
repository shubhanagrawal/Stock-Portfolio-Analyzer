import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { TrendingUp } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const setAuth = useAuthStore(state => state.setAuth)

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth({ user: data.user, accessToken: data.access_token })
      navigate('/dashboard')
    },
    onError: (err) => {
      setError(err.detail || 'Access Denied')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    loginMutation.mutate({ email, password })
  }

  return (
    <div className="min-h-screen bg-[#0b0c10] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-10 h-10 text-indigo-500" />
          <h1 className="text-3xl font-black tracking-tighter text-gray-100">STOCK_PRO</h1>
        </div>
        <h2 className="text-center text-sm uppercase tracking-widest font-bold text-gray-400">System Authentication</h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 border border-gray-800 py-8 px-4 shadow-2xl sm:rounded-sm sm:px-10">
          <form className="space-y-6 flex flex-col" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-sm text-xs font-mono uppercase">
                [ERROR] {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase">Operator Email</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  placeholder="operator@sys.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 tracking-wider uppercase">Passcode</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-sm shadow-sm text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loginMutation.isPending ? 'Authenticating...' : 'Initialize Session'}
              </button>
            </div>
            
            <div className="text-center text-xs mt-4">
              <span className="text-gray-500 font-mono">UNAUTHORIZED? </span>
              <Link to="/register" className="font-bold tracking-wider uppercase text-indigo-400 hover:text-indigo-300">
                Request Access
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
