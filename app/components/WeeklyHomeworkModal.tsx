'use client'

import React, { useState } from 'react'
import { Student, Homework } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  students: Student[]
  onAdd: (homeworks: Homework[]) => void
}

const DAYS = [
  {
    code: 'PAZARTESI',
    label: 'Pazartesi',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    code: 'SALI',
    label: 'Salı',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    code: 'CARSAMBA',
    label: 'Çarşamba',
    color: 'bg-teal-100 text-teal-700 border-teal-200',
  },
  {
    code: 'PERSEMBE',
    label: 'Perşembe',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  {
    code: 'CUMA',
    label: 'Cuma',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
  },
]

interface AssignmentRow {
  id: string
  subject: string
  isCustom: boolean
  description: string
}

const DEFAULT_ROWS: AssignmentRow[] = [
  { id: 'def-turkce', subject: 'TURKCE', isCustom: false, description: '' },
  { id: 'def-mat', subject: 'MATEMATIK', isCustom: false, description: '' },
  { id: 'def-fen', subject: 'FEN', isCustom: false, description: '' },
]

const WeeklyHomeworkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  onAdd,
}) => {
  const [selectedDay, setSelectedDay] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [rows, setRows] = useState<AssignmentRow[]>(
    DEFAULT_ROWS.map((r) => ({ ...r })),
  )

  React.useEffect(() => {
    if (isOpen) {
      setSelectedDay('')
      setSelectedStudentIds([])
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      setDueDate(nextWeek.toISOString().split('T')[0])
      setRows(DEFAULT_ROWS.map((r) => ({ ...r, description: '' })))
    }
  }, [isOpen])

  const removeRow = (id: string) => setRows(rows.filter((r) => r.id !== id))
  const updateRow = (
    id: string,
    field: 'subject' | 'description',
    value: string,
  ) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }
  const addCustomSubject = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        subject: '',
        isCustom: true,
        description: '',
      },
    ])
  }

  // Students that have the selected bookDay
  const dayStudents = selectedDay
    ? students.filter((s) => s.bookDay === selectedDay)
    : []

  // When day changes, auto-select all students in that day
  const handleDayChange = (dayCode: string) => {
    setSelectedDay(dayCode)
    const inDay = students.filter((s) => s.bookDay === dayCode)
    setSelectedStudentIds(inDay.map((s) => s.id))
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    if (selectedStudentIds.length === dayStudents.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(dayStudents.map((s) => s.id))
    }
  }

  const selectedStudents = dayStudents.filter((s) =>
    selectedStudentIds.includes(s.id),
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDay || !dueDate || selectedStudents.length === 0) return

    const groupId =
      Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)
    const newHomeworks: Homework[] = []

    for (const student of selectedStudents) {
      for (const row of rows) {
        const content = row.description.trim()
        const subjectName = row.isCustom
          ? row.subject.trim().toUpperCase()
          : row.subject
        if (!content || !subjectName) continue

        let titleSubject = subjectName
        if (subjectName === 'TURKCE') titleSubject = 'TÜRKÇE'
        else if (subjectName === 'MATEMATIK') titleSubject = 'MATEMATİK'
        else if (subjectName === 'FEN') titleSubject = 'FEN BİLİMLERİ'

        newHomeworks.push({
          id: Date.now().toString() + Math.random().toString(),
          title: `${titleSubject} - ${student.name}`,
          subject: subjectName,
          groupId,
          description: content,
          assignedDate: new Date().toISOString(),
          dueDate: new Date(dueDate).toISOString(),
          targetClasses: [student.className],
          targetStudentIds: [student.id],
          submissions: {},
          notifiedStudents: {},
          createdAt: new Date().toISOString(),
        })
      }
    }

    if (newHomeworks.length > 0) {
      onAdd(newHomeworks)
      onClose()
    } else {
      alert('En az bir ders için içerik giriniz.')
    }
  }

  if (!isOpen) return null

  const dayInfo = DAYS.find((d) => d.code === selectedDay)

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 pb-24 md:pb-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            <i className="fas fa-calendar-week mr-2 text-indigo-600"></i>
            Haftalık Ödev Ata
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 space-y-5 overflow-y-auto flex-1">
            {/* Day Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <i className="fas fa-calendar-day mr-1 text-indigo-500"></i>
                Kitap Günü Seçin
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.code}
                    type="button"
                    onClick={() => handleDayChange(day.code)}
                    className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                      selectedDay === day.code
                        ? day.color + ' border-current shadow-md scale-105'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Students for selected day */}
            {selectedDay && (
              <div
                className={`rounded-lg border-2 overflow-hidden ${dayInfo?.color || 'bg-gray-50 border-gray-200'}`}
              >
                <div className="flex items-center justify-between px-3 py-2 text-sm font-bold border-b border-current/20">
                  <span>
                    <i className="fas fa-users mr-1"></i>
                    {dayInfo?.label} Grubu ({dayStudents.length} öğrenci)
                  </span>
                  {dayStudents.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAll}
                      className="text-xs underline opacity-70 hover:opacity-100 font-medium"
                    >
                      {selectedStudentIds.length === dayStudents.length
                        ? 'Tümünü Kaldır'
                        : 'Tümünü Seç'}
                    </button>
                  )}
                </div>
                {dayStudents.length === 0 ? (
                  <p className="text-sm italic opacity-70 p-3">
                    Bu gün için atanmış öğrenci yok. Öğrenciler sayfasından
                    kitap günü atayabilirsiniz.
                  </p>
                ) : (
                  <div className="p-2 flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {dayStudents.map((s) => {
                      const checked = selectedStudentIds.includes(s.id)
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            checked
                              ? 'bg-white/70 shadow-sm'
                              : 'opacity-50 hover:opacity-75'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStudent(s.id)}
                            className="w-4 h-4 rounded accent-indigo-600"
                          />
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-xs opacity-60">
                            ({s.className})
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                <i className="fas fa-clock mr-1 text-indigo-500"></i>
                Son Teslim Tarihi
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            {/* Subjects */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Ders İçerikleri</h3>
                <button
                  type="button"
                  onClick={addCustomSubject}
                  className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-200 transition-colors"
                >
                  <i className="fas fa-plus mr-1"></i> Branş Ekle
                </button>
              </div>

              {rows.map((row) => (
                <div key={row.id} className="space-y-1">
                  {row.isCustom ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        placeholder="Ders Adı (Örn: İNGİLİZCE)"
                        value={row.subject}
                        onChange={(e) =>
                          updateRow(row.id, 'subject', e.target.value)
                        }
                        className="text-sm font-bold text-gray-700 py-1 px-2 border-b border-gray-300 focus:border-indigo-500 outline-none bg-transparent flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Dersi Sil"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between mb-1">
                      <label
                        className={`text-sm font-bold flex items-center gap-2 ${
                          row.subject === 'TURKCE'
                            ? 'text-red-600'
                            : row.subject === 'MATEMATIK'
                              ? 'text-blue-600'
                              : row.subject === 'FEN'
                                ? 'text-green-600'
                                : 'text-gray-700'
                        }`}
                      >
                        {row.subject === 'TURKCE' && (
                          <>
                            <i className="fas fa-book"></i> TÜRKÇE
                          </>
                        )}
                        {row.subject === 'MATEMATIK' && (
                          <>
                            <i className="fas fa-calculator"></i> MATEMATİK
                          </>
                        )}
                        {row.subject === 'FEN' && (
                          <>
                            <i className="fas fa-flask"></i> FEN BİLİMLERİ
                          </>
                        )}
                        {!['TURKCE', 'MATEMATIK', 'FEN'].includes(
                          row.subject,
                        ) && row.subject}
                      </label>
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                        title="Dersi Sil"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  )}
                  <textarea
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.id, 'description', e.target.value)
                    }
                    placeholder={
                      row.isCustom ? 'Ödev açıklaması...' : 'Ödev içeriği...'
                    }
                    rows={2}
                    className={`w-full rounded-md border-gray-300 shadow-sm focus:ring-2 sm:text-sm p-2 border ${
                      row.subject === 'TURKCE'
                        ? 'focus:border-red-500 focus:ring-red-500'
                        : row.subject === 'MATEMATIK'
                          ? 'focus:border-blue-500 focus:ring-blue-500'
                          : row.subject === 'FEN'
                            ? 'focus:border-green-500 focus:ring-green-500'
                            : 'focus:border-indigo-500 focus:ring-indigo-500'
                    }`}
                  />
                </div>
              ))}

              {rows.length === 0 && (
                <div className="text-center py-4 text-gray-500 italic text-sm">
                  Hiç ders eklenmedi. Yukarıdan branş ekleyebilirsiniz.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 shrink-0">
            <div className="text-sm text-gray-500 italic">
              {selectedStudents.length > 0 ? (
                <span className="text-indigo-600 font-semibold">
                  <i className="fas fa-users mr-1"></i>
                  {selectedStudents.length} öğrenciye ödev atanacak
                </span>
              ) : (
                '* Gün ve öğrenci seçin, ders içeriklerini doldurun'
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={selectedStudents.length === 0}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-paper-plane mr-1"></i>
                Ödevleri Ata
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WeeklyHomeworkModal
