import React, { useState, useEffect } from 'react'
import { Student, Homework, Subject } from '@/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  students: Student[]
  onAdd: (homeworks: Homework[]) => void
}

const PersonalizedHomeworkModal: React.FC<Props> = ({
  isOpen,
  onClose,
  students,
  onAdd,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [dueDate, setDueDate] = useState('')

  // Dynamic list of assignments
  interface AssignmentRow {
    id: string
    subject: string // The internal code/label to save
    isCustom: boolean
    description: string
  }

  const [rows, setRows] = useState<AssignmentRow[]>([])

  // Set default due date to tomorrow and reset fields
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setDueDate(tomorrow.toISOString().split('T')[0])
      setSelectedStudentId('')
      // Default rows
      setRows([
        {
          id: 'def-turkce',
          subject: 'TURKCE',
          isCustom: false,
          description: '',
        },
        {
          id: 'def-mat',
          subject: 'MATEMATIK',
          isCustom: false,
          description: '',
        },
        { id: 'def-fen', subject: 'FEN', isCustom: false, description: '' },
      ])
    }
  }, [isOpen])

  const addCustomSubject = () => {
    setRows([
      ...rows,
      {
        id: Date.now().toString(),
        subject: '', // User will type this
        isCustom: true,
        description: '',
      },
    ])
  }

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id))
  }

  const updateRow = (
    id: string,
    field: 'subject' | 'description',
    value: string,
  ) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId || !dueDate) return

    const student = students.find((s) => s.id === selectedStudentId)
    if (!student) return

    const newHomeworks: Homework[] = []
    const groupId =
      Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9)

    rows.forEach((row) => {
      const content = row.description.trim()
      // For custom subjects, subject name must be present
      const subjectName = row.isCustom
        ? row.subject.trim().toUpperCase()
        : row.subject

      if (content && subjectName) {
        // Map standard codes to labels for Title
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
    })

    if (newHomeworks.length > 0) {
      onAdd(newHomeworks)
      // Reset logic
      setRows([
        {
          id: 'def-turkce',
          subject: 'TURKCE',
          isCustom: false,
          description: '',
        },
        {
          id: 'def-mat',
          subject: 'MATEMATIK',
          isCustom: false,
          description: '',
        },
        { id: 'def-fen', subject: 'FEN', isCustom: false, description: '' },
      ])
      setSelectedStudentId('')
    }
  }

  if (!isOpen) return null

  const filteredStudents = students.sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 pb-24 md:pb-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 border-b shrink-0">
          <h2 className="text-xl font-bold text-gray-800">
            <i className="fas fa-user-pen mr-2 text-indigo-600"></i>
            Kişiye Özel Ödev Ata
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Form with Fixed Footer */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Scrollable Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğrenci Seçin
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Öğrenci Seçiniz...</option>
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center mb-2">
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
                <div key={row.id} className="space-y-1 relative group">
                  {row.isCustom ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        placeholder="Ders Adı (Örn: İNGİLİZCE)"
                        value={row.subject}
                        onChange={(e) =>
                          updateRow(row.id, 'subject', e.target.value)
                        }
                        className="text-sm font-bold text-gray-700 py-1 px-2 border-b border-gray-300 focus:border-indigo-500 outline-none bg-transparent w-full"
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
                      {!['TURKCE', 'MATEMATIK', 'FEN'].includes(row.subject) &&
                        row.subject}
                    </label>
                  )}

                  <textarea
                    value={row.description}
                    onChange={(e) =>
                      updateRow(row.id, 'description', e.target.value)
                    }
                    placeholder={
                      row.isCustom ? 'Ödev açıklaması...' : `Ödev içeriği...`
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

          {/* Fixed Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50 shrink-0">
            <div className="text-sm text-gray-500 italic">
              * Dolu olan alanlar için ödev oluşturulur.
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
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200"
              >
                Kaydet ve Devam Et
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PersonalizedHomeworkModal
