import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { authService } from '../services/auth.service'
import { useStore } from '../store'
import RoleSelector, { UserRole } from '../components/auth/RoleSelector'
import SchoolSelector, { SchoolOption } from '../components/auth/SchoolSelector'

export default function Register() {
  const navigate = useNavigate()
  const { setProfile } = useStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    schoolId: '',
    grade: '',
    gradeLetter: '',
  })
  const [selectedRole, setSelectedRole] = useState<UserRole>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [step, setStep] = useState(1)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, address')
          .order('name')

        if (error) throw error
        
        // Transform data to match SchoolOption interface
        const transformedSchools = (data || []).map(school => ({
          id: school.id,
          name: school.name,
          address: school.address || undefined,
          city: undefined // Extract from address if needed
        }))
        
        setSchools(transformedSchools)
      } catch (err) {
        console.error('Failed to fetch schools:', err)
        setError('Не удалось загрузить список школ. Проверьте подключение к базе данных.')
      }
    }

    fetchSchools()
  }, [])

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      setError('Введите ваше имя')
      return false
    }
    if (!formData.email.trim()) {
      setError('Введите email')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Введите корректный email')
      return false
    }
    
    // Students must select a grade
    if (selectedRole === 'student' && !formData.grade) {
      setError('Выберите класс')
      return false
    }
    
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (formData.password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают')
      return false
    }
    setError('')
    return true
  }

  const validateStep3 = () => {
    // Only students need to select a school
    if (selectedRole === 'student' && !formData.schoolId) {
      setError('Выберите школу')
      return false
    }
    if (!agreedToTerms) {
      setError('Необходимо принять условия использования')
      return false
    }
    setError('')
    return true
  }

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateStep3()) return

    setLoading(true)
    setError('')

    try {
      // Real Supabase registration using auth service
      if (selectedRole === 'student') {
        await authService.registerStudent({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          schoolId: formData.schoolId,
          grade: formData.grade,
          gradeLetter: formData.gradeLetter,
        })
      } else {
        await authService.registerOtherRole({
          email: formData.email,
          password: formData.password,
          fullName: formData.name,
          role: selectedRole,
        })
      }
      
      // Redirect to login after successful registration
      navigate('/login', { 
        state: { message: 'Регистрация успешна! Проверьте email для подтверждения.' } 
      })
    } catch (err: unknown) {
      console.error('Registration error:', err)
      
      // Handle different error types
      if (err && typeof err === 'object' && 'message' in err) {
        const errorMessage = (err as { message: string }).message
        
        // User-friendly error messages
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          setError('Этот email уже зарегистрирован. Попробуйте войти.')
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('Email rate limit exceeded')) {
          setError('Превышен лимит отправки email. Отключите подтверждение email в настройках Supabase или подождите несколько минут.')
        } else if (errorMessage.includes('Password')) {
          setError('Пароль должен содержать минимум 8 символов')
        } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          setError('База данных не настроена. Выполните миграции в Supabase. См. ПРОВЕРКА_SUPABASE.md')
        } else if (errorMessage.includes('Invalid API key')) {
          setError('Неверный API ключ Supabase. Проверьте .env файл. См. FIX_SUPABASE_KEY.md')
        } else {
          setError(errorMessage)
        }
      } else {
        setError('Произошла ошибка при регистрации')
      }
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500']
  const strengthLabels = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Отличный']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
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
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                AILesson
              </h1>
              <p className="text-sm text-gray-500">Alies AI</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">
            Регистрация
          </h2>
        </motion.div>

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                  step >= s 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white/50 text-gray-400 border border-gray-200'
                }`}
                animate={step === s ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {step > s ? <CheckCircle className="w-5 h-5" /> : s}
              </motion.div>
              {s < 3 && (
                <div className={`w-12 h-1 mx-1 rounded-full transition-all ${
                  step > s ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          className="liquid-glass rounded-3xl p-8 shadow-xl"
          layout
        >
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Info & Role */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-3">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Личные данные</h3>
                  <p className="text-sm text-gray-500">Расскажите о себе</p>
                </div>

                {/* Role Selection */}
                <RoleSelector
                  selectedRole={selectedRole}
                  onRoleChange={setSelectedRole}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ваше имя
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                      placeholder="Иван Иванов"
                    />
                  </div>
                </div>

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

                {/* Grade selection - only for students */}
                {selectedRole === 'student' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Класс
                      </label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                      >
                        <option value="">Выберите класс</option>
                        <option value="1">1 класс</option>
                        <option value="2">2 класс</option>
                        <option value="3">3 класс</option>
                        <option value="4">4 класс</option>
                        <option value="5">5 класс</option>
                        <option value="6">6 класс</option>
                        <option value="7">7 класс</option>
                        <option value="8">8 класс</option>
                        <option value="9">9 класс</option>
                        <option value="10">10 класс</option>
                        <option value="11">11 класс</option>
                        <option value="техникум">Техникум</option>
                        <option value="ВУЗ">ВУЗ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Буква класса (опционально)
                      </label>
                      <input
                        type="text"
                        value={formData.gradeLetter}
                        onChange={(e) => setFormData({ ...formData, gradeLetter: e.target.value.toUpperCase() })}
                        maxLength={1}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                        placeholder="А, Б, В..."
                      />
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* Step 2: Password */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mb-3">
                    <Lock className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">Безопасность</h3>
                  <p className="text-sm text-gray-500">Придумайте надёжный пароль</p>
                </div>

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
                      placeholder="Минимум 8 символов"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  {formData.password && (
                    <div className="mt-3">
                      <div className="flex gap-1 mb-1">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Надёжность: {strengthLabels[passwordStrength - 1] || 'Очень слабый'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подтвердите пароль
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70"
                      placeholder="Повторите пароль"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Пароли не совпадают
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Пароли совпадают
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: School & Terms */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-3">
                    <GraduationCap className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800">
                    {selectedRole === 'student' ? 'Ваша школа' : 'Завершение регистрации'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedRole === 'student' 
                      ? 'Выберите учебное заведение' 
                      : 'Подтвердите регистрацию'}
                  </p>
                </div>

                {/* School selection - only for students */}
                {selectedRole === 'student' && (
                  <>
                    <SchoolSelector
                      selectedSchoolId={formData.schoolId}
                      onSchoolChange={(schoolId) => setFormData({ ...formData, schoolId })}
                      schools={schools}
                      required
                    />

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-gray-800">Приветственный бонус</h4>
                          <p className="text-sm text-gray-600">
                            После регистрации вы получите <span className="font-semibold text-blue-600">50 монет мудрости</span> для создания уроков и викторин!
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Info for non-students */}
                {selectedRole !== 'student' && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-800">
                          {selectedRole === 'teacher' && 'Приветственный бонус для учителя'}
                          {selectedRole === 'parent' && 'Добро пожаловать, родитель!'}
                          {selectedRole === 'administrator' && 'Добро пожаловать, администратор!'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedRole === 'teacher' && (
                            <>После регистрации вы получите <span className="font-semibold text-blue-600">150 монет мудрости</span> для создания уроков!</span></>
                          )}
                          {selectedRole === 'parent' && 'Вы сможете отслеживать прогресс своих детей после привязки их аккаунтов.'}
                          {selectedRole === 'administrator' && 'У вас будет полный доступ к управлению платформой.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                    Я принимаю{' '}
                    <a href="#" className="text-blue-600 hover:underline">условия использования</a>
                    {' '}и{' '}
                    <a href="#" className="text-blue-600 hover:underline">политику конфиденциальности</a>
                  </span>
                </label>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-center gap-2 text-red-600"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Назад
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                >
                  Далее
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Регистрация...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-5 h-5" />
                      Зарегистрироваться
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Войти
              </Link>
            </p>
          </div>

          {/* Other roles info */}
          {selectedRole === 'student' && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Учителя, родители и администраторы могут выбрать свою роль на первом шаге
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
