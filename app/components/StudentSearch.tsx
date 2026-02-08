'use client'

import React from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const StudentSearch: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Öğrenci veya veli adı ara...',
}) => {
  return (
    <div className="relative">
      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm bg-slate-50"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      )}
    </div>
  )
}

// Helper function for Turkish-aware case-insensitive search
export const turkishSearch = (text: string, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true
  const normalizedText = text.toLocaleLowerCase('tr')
  const normalizedTerm = searchTerm.trim().toLocaleLowerCase('tr')
  return normalizedText.includes(normalizedTerm)
}

export default StudentSearch
