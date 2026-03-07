import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn,
  BookOpen,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { authService } from '../services/auth.service'
import { useStore } from '../store'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setProfile, profile } = useStore()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check for success message from registration
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
    }
  }, [location])

  useEffect(() => {
    if (profile) {
      navigate('/dashboard')
    }
  }, [profile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email) {
      setError('Введите email')
      return
    }

    if (!formData.password) {
      setError('Введите пароль')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Real Supabase authentication using auth service
      const userProfile = await authService.login({
        email: formData.email,
        password: formData.password,
      })
      
      // Update Zustand store with user profile
      setProfile(userProfile)
      
      navigate('/dashboard')
    } catch (err: unknown) {
      console.error('Login error:', err)
      
      // Handle different error types
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as { message: string }).message
        
        // User-friendly error messages
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('INVALID_CREDENTIALS')) {
          setError('Неверный email или пароль')
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Подтвердите email. Проверьте почту.')
        } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('База данных не настроена. См. ПРОВЕРКА_SUPABASE.md')
        } else if (errorMessage.includes('Invalid API key')) {
          setError('Неверный API ключ Supabase. См. FIX_SUPABASE_KEY.md')
        } else {
          setError(errorMessage)
        }
      } else {
        setError('Ошибка входа')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 safe-area-inset-top safe-area-inset-bottom">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, 30, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <motion.div 
          className="text-center mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 wiggle-hover">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AILesson
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">Alies AI</p>
            </div>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700">Вход в систему</h2>
        </motion.div>

        {/* Success message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-xl bg-green-50 border border-green-100 flex items-center gap-3 text-green-700"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{successMessage}</p>
          </motion.div>
        )}

        {/* Form card */}
        <motion.div
          className="liquid-glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl bounce-in"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 tap-target btn-interactive scale-hover text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Вход...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Войти
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Войдите с учетными данными, полученными при регистрации
        </p>
      </motion.div>
    </div>
  )
}
