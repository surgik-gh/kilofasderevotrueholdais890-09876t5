import { useState, useEffect, useMemo } from 'react'
import { School, Search, MapPin } from 'lucide-react'

export interface SchoolOption {
  id: string
  name: string
  address?: string
  city?: string
}

interface SchoolSelectorProps {
  selectedSchoolId: string
  onSchoolChange: (schoolId: string) => void
  schools: SchoolOption[]
  required?: boolean
  placeholder?: string
  label?: string
}

export default function SchoolSelector({
  selectedSchoolId,
  onSchoolChange,
  schools,
  required = false,
  placeholder = 'Выберите школу...',
  label = 'Школа'
}: SchoolSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Filter schools based on search query
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) {
      return schools
    }
    
    const query = searchQuery.toLowerCase()
    return schools.filter(school => 
      school.name.toLowerCase().includes(query) ||
      school.city?.toLowerCase().includes(query) ||
      school.address?.toLowerCase().includes(query)
    )
  }, [schools, searchQuery])

  // Get selected school
  const selectedSchool = schools.find(s => s.id === selectedSchoolId)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.school-selector-container')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectSchool = (schoolId: string) => {
    onSchoolChange(schoolId)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="school-selector-container">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {/* Selected value display / trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all bg-white/70 text-left flex items-center justify-between"
        >
          <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          
          <div className="flex-1">
            {selectedSchool ? (
              <div>
                <div className="font-medium text-gray-800">{selectedSchool.name}</div>
                {selectedSchool.city && (
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {selectedSchool.city}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Search input */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск школы..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* School list */}
            <div className="max-h-64 overflow-y-auto">
              {filteredSchools.length > 0 ? (
                filteredSchools.map((school) => (
                  <button
                    key={school.id}
                    type="button"
                    onClick={() => handleSelectSchool(school.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                      selectedSchoolId === school.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="font-medium text-gray-800">{school.name}</div>
                    {(school.city || school.address) && (
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {school.city && <span>{school.city}</span>}
                        {school.city && school.address && <span>•</span>}
                        {school.address && <span>{school.address}</span>}
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  <School className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Школы не найдены</p>
                  {searchQuery && (
                    <p className="text-xs mt-1">Попробуйте изменить запрос</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer note */}
            {schools.length > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Не нашли свою школу? Обратитесь в поддержку
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
