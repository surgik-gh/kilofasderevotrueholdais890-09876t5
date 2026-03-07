import { motion } from 'framer-motion'
import { 
  GraduationCap, 
  Users, 
  UserCog, 
  Shield,
  LucideIcon
} from 'lucide-react'

export type UserRole = 'student' | 'teacher' | 'parent' | 'administrator'

interface RoleOption {
  id: UserRole
  label: string
  icon: LucideIcon
  color: string
  description: string
}

interface RoleSelectorProps {
  selectedRole: UserRole
  onRoleChange: (role: UserRole) => void
  availableRoles?: UserRole[]
}

const roleOptions: RoleOption[] = [
  { 
    id: 'student', 
    label: 'Ученик', 
    icon: GraduationCap, 
    color: 'from-blue-500 to-indigo-600',
    description: 'Создавайте уроки и проходите викторины'
  },
  { 
    id: 'teacher', 
    label: 'Учитель', 
    icon: Users, 
    color: 'from-emerald-500 to-teal-600',
    description: 'Создавайте уроки и отслеживайте прогресс учеников'
  },
  { 
    id: 'parent', 
    label: 'Родитель', 
    icon: UserCog, 
    color: 'from-purple-500 to-pink-600',
    description: 'Отслеживайте прогресс своих детей'
  },
  { 
    id: 'administrator', 
    label: 'Администратор', 
    icon: Shield, 
    color: 'from-orange-500 to-red-600',
    description: 'Управляйте платформой и поддержкой'
  },
]

export default function RoleSelector({ 
  selectedRole, 
  onRoleChange, 
  availableRoles 
}: RoleSelectorProps) {
  const roles = availableRoles 
    ? roleOptions.filter(role => availableRoles.includes(role.id))
    : roleOptions

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Выберите роль
      </label>
      <div className="grid grid-cols-2 gap-3">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id
          
          return (
            <motion.button
              key={role.id}
              type="button"
              onClick={() => onRoleChange(role.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-transparent shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 bg-white/50'
              }`}
            >
              {isSelected && (
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${role.color} opacity-10`} />
              )}
              <div className="relative flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected 
                    ? `bg-gradient-to-br ${role.color} text-white` 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-sm font-medium ${
                  isSelected ? 'text-gray-800' : 'text-gray-600'
                }`}>
                  {role.label}
                </span>
                <span className={`text-xs text-center ${
                  isSelected ? 'text-gray-600' : 'text-gray-500'
                }`}>
                  {role.description}
                </span>
              </div>
              {isSelected && (
                <motion.div
                  layoutId="selectedRole"
                  className="absolute inset-0 rounded-xl border-2 border-blue-500"
                  transition={{ type: "spring", duration: 0.3 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
