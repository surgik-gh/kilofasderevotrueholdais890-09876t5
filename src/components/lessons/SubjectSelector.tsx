import { motion } from 'framer-motion';
import { SUBJECT_CATEGORIES } from '@/utils/subjects';
import { BookOpen, Calculator, Globe, Atom, Heart, Music } from 'lucide-react';

interface SubjectSelectorProps {
  value: string;
  onChange: (subject: string) => void;
  className?: string;
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  'Точные науки': <Calculator className="w-5 h-5" />,
  'Гуманитарные науки': <BookOpen className="w-5 h-5" />,
  'Естественные науки': <Atom className="w-5 h-5" />,
  'Другое': <Music className="w-5 h-5" />,
};

// Color schemes for categories
const categoryColors: Record<string, { bg: string; text: string; hover: string }> = {
  'Точные науки': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-100',
  },
  'Гуманитарные науки': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-100',
  },
  'Естественные науки': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    hover: 'hover:bg-green-100',
  },
  'Другое': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hover: 'hover:bg-amber-100',
  },
};

export function SubjectSelector({ value, onChange, className = '' }: SubjectSelectorProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-700 mb-3">
        Предмет
      </label>
      
      <div className="space-y-4">
        {Object.entries(SUBJECT_CATEGORIES).map(([category, subjects], categoryIndex) => {
          const colors = categoryColors[category];
          const icon = categoryIcons[category];
          
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.05 }}
              className="glass rounded-xl p-4"
            >
              {/* Category Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}>
                  {icon}
                </div>
                <h3 className="font-bold text-slate-800">{category}</h3>
              </div>
              
              {/* Subject Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => onChange(subject)}
                    className={`
                      px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all truncate
                      ${value === subject
                        ? `${colors.bg} ${colors.text} ring-2 ring-offset-2 ring-${colors.text.split('-')[1]}-500`
                        : `bg-white text-slate-600 ${colors.hover} border border-slate-200`
                      }
                    `}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
