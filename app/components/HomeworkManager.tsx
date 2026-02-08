'use client'

import React, { useState, useMemo } from 'react'
import { Homework, Student, HomeworkStatus, Subject } from '@/types'
import {
  suggestHomeworkDescription,
  generateParentMessage,
  generateCombinedParentMessage,
} from '@/services/geminiService'
import toast from 'react-hot-toast'
import StudentSearch, { turkishSearch } from './StudentSearch'
import PersonalizedHomeworkModal from './PersonalizedHomeworkModal'

interface Props {
  homeworks: Homework[]
  students: Student[]
  onAdd: (h: Homework) => void
  onDelete: (id: string) => void
  onUpdate: (h: Homework) => void
  onUpdateStatus: (
    hwId: string,
    studentId: string,
    status: HomeworkStatus,
  ) => void
}

const HomeworkManager: React.FC<Props> = ({
  homeworks,
  students,
  onAdd,
  onDelete,
  onUpdate,
  onUpdateStatus,
}) => {
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<string>('GENEL')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [targetClasses, setTargetClasses] = useState<string[]>([])
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [analyzingHomeworkIds, setAnalyzingHomeworkIds] = useState<
    string[] | null
  >(null)
  /* Deprecated: analyzingHomework derived state replaced by analyzingHomeworkIds array */
  const [analysisFilter, setAnalysisFilter] = useState<string>('ALL')
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState<string>('')
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL')
  const [homeworkSearchTerm, setHomeworkSearchTerm] = useState('')
  const [showPersonalizedModal, setShowPersonalizedModal] = useState(false)

  const existingClasses = useMemo(
    () => Array.from(new Set(students.map((s) => s.className))).sort(),
    [students],
  )

  const handleSuggest = async () => {
    if (!title) return
    setIsSuggesting(true)
    try {
      const desc = await suggestHomeworkDescription(title)
      setDescription(desc)
    } catch (error) {
      toast.error('Öneri alınamadı')
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleEdit = (homework: Homework) => {
    setEditingHomework(homework)
    setTitle(homework.title)
    setSubject(homework.subject || 'GENEL')
    setDescription(homework.description)
    setDueDate(homework.dueDate)
    setTargetClasses(homework.targetClasses)
    setTargetStudentIds(homework.targetStudentIds || [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingHomework(null)
    setTitle('')
    setSubject('GENEL')
    setDescription('')
    setDueDate('')
    setTargetClasses([])
    setTargetStudentIds([])
  }

  // State for sent messages (Set of "homeworkId-studentId")
  const [sentMessages, setSentMessages] = useState<Set<string>>(new Set())

  const toggleClass = (className: string) => {
    setTargetClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className],
    )
  }

  const toggleStudent = (id: string) => {
    setTargetStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id],
    )
  }

  const availableStudents = useMemo(
    () =>
      students
        .filter((s) => targetClasses.includes(s.className))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, targetClasses],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || targetClasses.length === 0) {
      toast.error('Lütfen başlık ve en az bir sınıf seçin')
      return
    }

    if (editingHomework) {
      onUpdate({
        ...editingHomework,
        title,
        subject,
        description,
        dueDate: dueDate || new Date().toISOString(),
        targetClasses,
        targetStudentIds,
      })
      toast.success('Ödev başarıyla güncellendi 📝')
      handleCancel()
    } else {
      onAdd({
        id: Date.now().toString(),
        title,
        subject,
        description,
        assignedDate: new Date().toISOString(),
        dueDate: dueDate || new Date().toISOString(),
        targetClasses,
        targetStudentIds,
        submissions: {},
      })
      toast.success('Yeni ödev başarıyla oluşturuldu ✨')

      setTitle('')
      setSubject('GENEL')
      setDescription('')
      setDueDate('')
      setTargetClasses([])
      setTargetStudentIds([])
    }
  }

  // Analysis View Implementation
  // Derive fresh homework data from IDs to ensure updates are reflected
  const analyzingHomeworks = analyzingHomeworkIds
    ? homeworks.filter((h) => analyzingHomeworkIds.includes(h.id))
    : null

  if (analyzingHomeworks && analyzingHomeworks.length > 0) {
    // Collect all unique target student IDs from all homeworks
    const allTargetStudentIds = new Set<string>()
    analyzingHomeworks.forEach((h) => {
      if (h.targetStudentIds) {
        h.targetStudentIds.forEach((id) => allTargetStudentIds.add(id))
      }
    })

    // If no specific targets, we might need logic for "targetClasses"
    // But for "Nested Group" mode, usually targetStudentIds are set.
    // Let's assume we filter students who are targeted by AT LEAST ONE homework

    const relevantStudents = students
      .filter((s) => {
        // If explicitly targeted in any homework
        if (allTargetStudentIds.has(s.id)) return true

        // Or if belongs to a class targeted by any homework
        return analyzingHomeworks.some((h) =>
          h.targetClasses.includes(s.className),
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    const filteredStudents = relevantStudents.filter((s) => {
      // Check status of ALL homeworks?
      // For filter: "MISSING" means "Has AT LEAST ONE missing homework"
      // "DONE" means "ALL homeworks are done"

      const statuses = analyzingHomeworks.map(
        (h) => h.submissions[s.id] || HomeworkStatus.PENDING,
      )

      let statusMatch = true
      if (analysisFilter === 'DONE') {
        statusMatch = statuses.every((st) => st === HomeworkStatus.DONE)
      } else if (analysisFilter === 'MISSING') {
        statusMatch = statuses.some((st) => st === HomeworkStatus.MISSING)
      } else if (analysisFilter === 'INCOMPLETE') {
        statusMatch = statuses.some((st) => st === HomeworkStatus.INCOMPLETE)
      } else if (analysisFilter === 'ABSENT') {
        statusMatch = statuses.some((st) => st === HomeworkStatus.ABSENT)
      } else if (analysisFilter === 'PENDING') {
        statusMatch = statuses.some((st) => st === HomeworkStatus.PENDING)
      }

      // Search filter
      const searchMatch =
        turkishSearch(s.name, analysisSearchTerm) ||
        turkishSearch(s.parentName, analysisSearchTerm)
      return statusMatch && searchMatch
    })

    // Stats Logic (Aggregated)
    // We count "Students" who have at least one of these statuses
    const stats = {
      total: relevantStudents.length,
      done: relevantStudents.filter((s) =>
        analyzingHomeworks.every(
          (h) =>
            (h.submissions[s.id] || HomeworkStatus.PENDING) ===
            HomeworkStatus.DONE,
        ),
      ).length,
      missing: relevantStudents.filter((s) =>
        analyzingHomeworks.some(
          (h) =>
            (h.submissions[s.id] || HomeworkStatus.PENDING) ===
            HomeworkStatus.MISSING,
        ),
      ).length,
      incomplete: relevantStudents.filter((s) =>
        analyzingHomeworks.some(
          (h) =>
            (h.submissions[s.id] || HomeworkStatus.PENDING) ===
            HomeworkStatus.INCOMPLETE,
        ),
      ).length,
      absent: relevantStudents.filter((s) =>
        analyzingHomeworks.some(
          (h) =>
            (h.submissions[s.id] || HomeworkStatus.PENDING) ===
            HomeworkStatus.ABSENT,
        ),
      ).length,
    }

    // Determine Title (Group Title or Single Title)
    const firstHw = analyzingHomeworks[0]
    let viewTitle = firstHw.title
    let viewDesc = firstHw.description

    if (analyzingHomeworks.length > 1) {
      // Assume it's a group
      const assignedDate = new Date(firstHw.assignedDate).toLocaleDateString(
        'tr-TR',
      )
      const dueDate = new Date(firstHw.dueDate).toLocaleDateString('tr-TR')
      viewTitle = `${assignedDate} - ${dueDate} Ödev Kontrolü`
      viewDesc = `${analyzingHomeworks.length} adet ödev içerir.`
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{viewTitle}</h2>
            <p className="text-sm text-gray-500">{viewDesc}</p>
          </div>
          <button
            onClick={() => setAnalyzingHomeworkIds(null)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
          >
            Geri Dön
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="bg-purple-100 p-3 rounded-lg text-center border-b-4 border-purple-300">
            <div className="text-xl font-bold text-purple-700">
              {stats.total}
            </div>
            <div className="text-xs text-purple-600 font-bold uppercase">
              Toplam Öğrenci
            </div>
          </div>
          <div className="bg-green-100 p-3 rounded-lg text-center border-b-4 border-green-300">
            <div className="text-xl font-bold text-green-700">{stats.done}</div>
            <div className="text-xs text-green-600 font-bold uppercase">
              Tamamlayanlar
            </div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg text-center border-b-4 border-red-300">
            <div className="text-xl font-bold text-red-700">
              {stats.missing}
            </div>
            <div className="text-xs text-red-600 font-bold uppercase">
              Yapmayanlar
            </div>
          </div>
          <div className="bg-yellow-100 p-3 rounded-lg text-center border-b-4 border-yellow-300">
            <div className="text-xl font-bold text-yellow-700">
              {stats.incomplete}
            </div>
            <div className="text-xs text-yellow-600 font-bold uppercase">
              Eksik Olanlar
            </div>
          </div>
          <div className="bg-violet-100 p-3 rounded-lg text-center border-b-4 border-violet-300">
            <div className="text-xl font-bold text-violet-700">
              {stats.absent}
            </div>
            <div className="text-xs text-violet-600 font-bold uppercase">
              Getirmeyenler
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="w-full md:w-1/3">
              <StudentSearch
                value={analysisSearchTerm}
                onChange={setAnalysisSearchTerm}
              />
            </div>
            {/* Status Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
              {[
                { id: 'ALL', label: 'TÜMÜ', color: 'gray' },
                { id: 'PENDING', label: 'BEKLİYOR', color: 'gray' },
                { id: 'DONE', label: 'TAMAM', color: 'green' },
                { id: 'MISSING', label: 'YAPMADI', color: 'red' },
                { id: 'INCOMPLETE', label: 'EKSİK', color: 'yellow' },
                { id: 'ABSENT', label: 'GETİRMEDİ', color: 'violet' },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setAnalysisFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap border-2 ${
                    analysisFilter === filter.id
                      ? `bg-${filter.color}-100 text-${filter.color}-700 border-${filter.color}-300 shadow-sm`
                      : 'bg-white text-gray-400 border-transparent hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Student Grid */}
          <div className="max-h-[600px] overflow-y-auto bg-gray-50/50 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student) => {
              // Determine card style based on overall status ???
              // For now keep white, maybe highlight if ALL DONE
              const isAllDone = analyzingHomeworks.every(
                (h) =>
                  (h.submissions[student.id] || HomeworkStatus.PENDING) ===
                  HomeworkStatus.DONE,
              )

              return (
                <div
                  key={student.id}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 bg-white border-gray-100 hover:border-indigo-200 hover:shadow-md ${isAllDone ? 'border-green-200 bg-green-50' : ''}`}
                >
                  {/* Student Info */}
                  <div className="flex justify-between items-start mb-3 border-b pb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg leading-tight">
                        {student.name}
                      </h3>
                      <div className="text-xs text-gray-500 font-medium mt-1">
                        {student.className} • {student.parentName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAllDone && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                          ✅
                        </span>
                      )}
                      <button
                        onClick={() => {
                          // Gather all homework statuses for this student
                          const homeworkItems = analyzingHomeworks.map((h) => ({
                            subject: h.subject || 'GENEL',
                            description: h.description,
                            status:
                              h.submissions[student.id] ||
                              HomeworkStatus.PENDING,
                          }))

                          const firstHw = analyzingHomeworks[0]
                          const message = generateCombinedParentMessage(
                            student.name,
                            homeworkItems,
                            firstHw.assignedDate,
                            firstHw.dueDate,
                          )

                          const encodedMessage = encodeURIComponent(message)
                          const phone = student.parentPhone.startsWith('9')
                            ? student.parentPhone
                            : `9${student.parentPhone}`
                          const url = `https://wa.me/${phone}?text=${encodedMessage}`
                          window.open(url, '_blank')
                        }}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-sm"
                      >
                        <i className="fab fa-whatsapp"></i>
                        Toplu Bildir
                      </button>
                    </div>
                  </div>

                  {/* List of Homeworks for this Student */}
                  <div className="space-y-3">
                    {analyzingHomeworks.map((h) => {
                      const status =
                        h.submissions[student.id] || HomeworkStatus.PENDING
                      return (
                        <div
                          key={h.id}
                          className="bg-gray-50 p-2 rounded border border-gray-100"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                h.subject === 'MATEMATIK'
                                  ? 'bg-blue-100 text-blue-700'
                                  : h.subject === 'TURKCE'
                                    ? 'bg-red-100 text-red-700'
                                    : h.subject === 'FEN'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {h.subject === 'MATEMATIK'
                                ? 'MAT'
                                : h.subject === 'TURKCE'
                                  ? 'TR'
                                  : h.subject === 'FEN'
                                    ? 'FEN'
                                    : h.subject || 'GENEL'}
                            </span>
                            <span
                              className="text-xs text-gray-600 truncate max-w-[120px]"
                              title={h.description}
                            >
                              {h.description}
                            </span>
                          </div>

                          {/* Buttons for this homework */}
                          <div className="flex justify-between gap-1">
                            {[
                              {
                                s: HomeworkStatus.DONE,
                                icon: 'check',
                                color: 'green',
                              },
                              {
                                s: HomeworkStatus.MISSING,
                                icon: 'times',
                                color: 'red',
                              },
                              {
                                s: HomeworkStatus.INCOMPLETE,
                                icon: 'exclamation',
                                color: 'yellow',
                              },
                              {
                                s: HomeworkStatus.ABSENT,
                                icon: 'briefcase',
                                color: 'violet',
                              },
                            ].map((btn) => {
                              const isActive = status === btn.s
                              let activeClass = ''
                              let inactiveClass = ''

                              if (btn.color === 'yellow') {
                                // Use Orange for better visibility on white background
                                activeClass =
                                  'bg-orange-500 text-white shadow-sm ring-1 ring-orange-500'
                                inactiveClass =
                                  'bg-white border border-gray-200 text-gray-300 hover:text-orange-600 hover:border-orange-200'
                              } else if (btn.color === 'violet') {
                                // Use darker purple for clearer distinction
                                activeClass =
                                  'bg-purple-600 text-white shadow-sm ring-1 ring-purple-600'
                                inactiveClass =
                                  'bg-white border border-gray-200 text-gray-300 hover:text-purple-600 hover:border-purple-200'
                              } else {
                                activeClass = `bg-${btn.color}-500 text-white shadow-sm ring-1 ring-${btn.color}-500`
                                inactiveClass = `bg-white border border-gray-200 text-gray-300 hover:text-${btn.color}-600 hover:border-${btn.color}-200`
                              }

                              return (
                                <button
                                  key={btn.s}
                                  onClick={() => {
                                    const newStatus = isActive
                                      ? HomeworkStatus.PENDING
                                      : btn.s
                                    onUpdateStatus(h.id, student.id, newStatus)
                                  }}
                                  className={`w-7 h-7 rounded flex items-center justify-center transition-all ${
                                    isActive ? activeClass : inactiveClass
                                  }`}
                                  title={
                                    btn.s === HomeworkStatus.INCOMPLETE
                                      ? 'Eksik'
                                      : btn.s === HomeworkStatus.ABSENT
                                        ? 'Getirmedi'
                                        : ''
                                  }
                                >
                                  <i
                                    className={`fas fa-${btn.icon} text-xs`}
                                  ></i>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const handlePersonalizedAdd = (newHomeworks: Homework[]) => {
    newHomeworks.forEach((h) => onAdd(h))
    toast.success(
      `${newHomeworks.length} adet kişiye özel ödev oluşturuldu! 🚀`,
    )
  }

  // Main Form and List View
  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-800">
          {editingHomework ? 'Ödevi Düzenle' : 'Yeni Ödev Ekle'}
        </h2>

        <button
          type="button"
          onClick={() => setShowPersonalizedModal(true)}
          className="w-full bg-indigo-50 border-2 border-dashed border-indigo-200 text-indigo-700 p-3 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 font-bold mb-4"
        >
          <i className="fas fa-user-pen text-xl"></i>
          KİŞİYE ÖZEL HIZLI ÖDEV EKLE
        </button>

        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Başlık
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ödev başlığı..."
            />
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting || !title}
              className="bg-purple-100 text-purple-700 px-4 py-2 rounded-md hover:bg-purple-200 disabled:opacity-50 transition-colors"
            >
              {isSuggesting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-wand-magic-sparkles"></i>
              )}
            </button>
          </div>
        </div>

        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ders
          </label>
          <div className="flex gap-2">
            {[
              {
                id: 'TURKCE',
                label: 'TÜRKÇE',
                color: 'bg-red-100 text-red-700 border-red-200',
              },
              {
                id: 'MATEMATIK',
                label: 'MATEMATİK',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
              },
              {
                id: 'FEN',
                label: 'FEN BİLİMLERİ',
                color: 'bg-green-100 text-green-700 border-green-200',
              },
              {
                id: 'GENEL',
                label: 'GENEL',
                color: 'bg-gray-100 text-gray-700 border-gray-200',
              },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSubject(s.id)}
                className={`flex-1 py-2 rounded-md text-sm font-bold border transition-all ${
                  subject === s.id
                    ? `${s.color} ring-2 ring-offset-1 ring-${s.color.split('-')[1]}-400`
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description Textarea */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Açıklama
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Ödev detayları..."
          />
        </div>

        {/* Class Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sınıflar
          </label>
          <div className="flex flex-wrap gap-2">
            {existingClasses.map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => toggleClass(cls)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  targetClasses.includes(cls)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Target Student Selection (Optional) */}
        {targetClasses.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Öğrenci Seçimi (Tüm sınıf için boş bırakın)
            </label>
            <div className="max-h-40 overflow-y-auto border rounded-md p-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => toggleStudent(student.id)}
                  className={`cursor-pointer p-2 rounded text-sm flex items-center gap-2 ${
                    targetStudentIds.includes(student.id)
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      targetStudentIds.includes(student.id)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {targetStudentIds.includes(student.id) && (
                      <i className="fas fa-check text-white text-xs"></i>
                    )}
                  </div>
                  <span className="truncate">
                    {student.name} ({student.className})
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {targetStudentIds.length === 0
                ? 'Tüm sınıftaki öğrencilere atanacak.'
                : `${targetStudentIds.length} öğrenci seçildi.`}
            </div>
          </div>
        )}

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Son Teslim Tarihi
          </label>
          <input
            type="date"
            value={dueDate ? dueDate.split('T')[0] : ''}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2">
          {editingHomework && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm"
          >
            {editingHomework ? 'Güncelle' : 'Oluştur'}
          </button>
        </div>
      </form>

      {/* Homework List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Ödev Listesi
        </h3>

        {/* Search/Filter Bar */}
        {/* Search/Filter Bar */}
        <div className="space-y-3 mb-4">
          <input
            type="text"
            placeholder="Öğrenci adı veya ödev içeriği ara..."
            value={homeworkSearchTerm}
            onChange={(e) => setHomeworkSearchTerm(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
          />

          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[
              {
                id: 'ALL',
                label: 'TÜM DERSLER',
                color: 'bg-gray-100 text-gray-700',
              },
              {
                id: 'TURKCE',
                label: 'TÜRKÇE',
                color: 'bg-red-100 text-red-700',
              },
              {
                id: 'MATEMATIK',
                label: 'MATEMATİK',
                color: 'bg-blue-100 text-blue-700',
              },
              { id: 'FEN', label: 'FEN', color: 'bg-green-100 text-green-700' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSubjectFilter(f.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  subjectFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {homeworks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              Henüz ödev oluşturulmamış.
            </div>
          ) : (
            <>
              {/* Grouped Homeworks - Nested Structure */}
              {Object.entries(
                homeworks
                  .filter(
                    (h) =>
                      (subjectFilter === 'ALL' ||
                        h.subject === subjectFilter) &&
                      h.groupId &&
                      h.targetStudentIds &&
                      h.targetStudentIds.length > 0,
                  )
                  .reduce(
                    (acc, h) => {
                      const sId = h.targetStudentIds![0]
                      if (!acc[sId]) acc[sId] = []
                      acc[sId].push(h)
                      return acc
                    },
                    {} as Record<string, Homework[]>,
                  ),
              )
                .filter(([studentId, _]) => {
                  if (!homeworkSearchTerm) return true
                  const student = students.find((s) => s.id === studentId)
                  if (!student) return false
                  return (
                    turkishSearch(student.name, homeworkSearchTerm) ||
                    turkishSearch(student.parentName, homeworkSearchTerm)
                  )
                })
                .map(([studentId, studentAllHomeworks]) => {
                  const student = students.find((s) => s.id === studentId)
                  const studentName = student?.name || 'Bilinmeyen Öğrenci'

                  // Group by GroupId within student
                  const studentGroups = studentAllHomeworks.reduce(
                    (acc, h) => {
                      if (!acc[h.groupId!]) acc[h.groupId!] = []
                      acc[h.groupId!].push(h)
                      return acc
                    },
                    {} as Record<string, Homework[]>,
                  )

                  const activeGroupsCount = Object.keys(studentGroups).length

                  // Check if ALL homeworks for this student are done (optional visual cue)
                  const isStudentAllDone = studentAllHomeworks.every(
                    (h) => h.submissions[studentId] === HomeworkStatus.DONE,
                  )

                  return (
                    <div
                      key={studentId}
                      className="bg-white rounded-lg shadow-sm border border-indigo-200 overflow-hidden mb-4"
                    >
                      {/* Level 1: Student Accordion */}
                      <details className="group/student">
                        <summary className="flex justify-between items-center p-4 cursor-pointer bg-white hover:bg-indigo-50 transition-colors select-none">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-lg ${isStudentAllDone ? 'bg-green-500' : 'bg-indigo-600'}`}
                            >
                              {isStudentAllDone ? (
                                <i className="fas fa-check-double"></i>
                              ) : (
                                <i className="fas fa-user-graduate"></i>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800 text-xl">
                                {studentName}
                              </h4>
                              <div className="text-sm text-indigo-600 font-medium">
                                {activeGroupsCount} Ödev Grubu Bekliyor
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 group-open/student:rotate-180 transition-transform duration-200">
                              <i className="fas fa-chevron-down text-xl"></i>
                            </span>
                          </div>
                        </summary>

                        {/* Level 1 Content: List of Groups */}
                        <div className="p-4 bg-indigo-50/50 space-y-4 border-t border-indigo-100">
                          {Object.entries(studentGroups).map(
                            ([groupId, group]) => {
                              const first = group[0]
                              const assignedDate = new Date(
                                first.assignedDate,
                              ).toLocaleDateString('tr-TR')
                              const dueDate = new Date(
                                first.dueDate,
                              ).toLocaleDateString('tr-TR')
                              const groupTitle = `${assignedDate} - ${dueDate} Ödevleri`

                              const isGroupDone = group.every(
                                (h) =>
                                  h.submissions[studentId] ===
                                  HomeworkStatus.DONE,
                              )

                              return (
                                <div
                                  key={groupId}
                                  className="bg-white rounded-lg border border-indigo-100 shadow-sm overflow-hidden"
                                >
                                  {/* Level 2: Homework Group Accordion */}
                                  <details className="group/homework" open>
                                    <summary className="flex justify-between items-center p-3 cursor-pointer bg-white hover:bg-gray-50 transition-colors select-none border-b border-gray-100">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-2 h-2 rounded-full ${isGroupDone ? 'bg-green-500' : 'bg-orange-400'}`}
                                        ></div>
                                        <span className="font-semibold text-gray-700">
                                          {groupTitle}
                                        </span>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                          {group.length} Ders
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault()
                                            setAnalyzingHomeworkIds(
                                              group.map((h) => h.id),
                                            ) // Analyze the whole group
                                          }}
                                          className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-indigo-700 transition"
                                        >
                                          <i className="fas fa-chart-pie mr-1"></i>
                                          Tüm Grubu Kontrol Et
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault() // Prevent accordion toggle
                                            if (
                                              window.confirm(
                                                'Bu ödev grubunu tamamen silmek istediğinize emin misiniz?',
                                              )
                                            ) {
                                              group.forEach((h) =>
                                                onDelete(h.id),
                                              )
                                              toast.success(
                                                'Ödev grubu silindi',
                                              )
                                            }
                                          }}
                                          className="text-gray-400 hover:text-red-600 transition-colors"
                                          title="Grubu Sil"
                                        >
                                          <i className="fas fa-trash-alt"></i>
                                        </button>
                                        <span className="text-gray-400 group-open/homework:rotate-180 transition-transform duration-200">
                                          <i className="fas fa-chevron-down"></i>
                                        </span>
                                      </div>
                                    </summary>

                                    {/* Level 3 Content: Homework Items */}
                                    <div className="p-3 space-y-2 bg-gray-50/50">
                                      {group.map((h) => {
                                        const status =
                                          h.submissions[studentId] ||
                                          HomeworkStatus.PENDING

                                        return (
                                          <div
                                            key={h.id}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded bg-white border border-gray-100 hover:shadow-sm transition-all"
                                          >
                                            <div className="flex items-start gap-3 flex-1">
                                              <span
                                                className={`text-[10px] px-2 py-1 rounded font-bold shrink-0 mt-1 ${
                                                  h.subject === 'TURKCE'
                                                    ? 'bg-red-100 text-red-700'
                                                    : h.subject === 'MATEMATIK'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : h.subject === 'FEN'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-indigo-100 text-indigo-700'
                                                }`}
                                              >
                                                {h.subject === 'TURKCE'
                                                  ? 'TR'
                                                  : h.subject === 'MATEMATIK'
                                                    ? 'MAT'
                                                    : h.subject === 'FEN'
                                                      ? 'FEN'
                                                      : h.subject || 'GENEL'}
                                              </span>
                                              <div className="text-sm font-medium text-gray-700">
                                                {h.description}
                                              </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex gap-1 shrink-0">
                                              {[
                                                {
                                                  s: HomeworkStatus.DONE,
                                                  icon: 'check',
                                                  color: 'green',
                                                  label: 'Yapıldı',
                                                },
                                                {
                                                  s: HomeworkStatus.MISSING,
                                                  icon: 'times',
                                                  color: 'red',
                                                  label: 'Yapılmadı',
                                                },
                                                {
                                                  s: HomeworkStatus.INCOMPLETE,
                                                  icon: 'exclamation',
                                                  color: 'yellow',
                                                  label: 'Eksik',
                                                },
                                                {
                                                  s: HomeworkStatus.ABSENT,
                                                  icon: 'briefcase',
                                                  color: 'violet',
                                                  label: 'Getirmedi',
                                                },
                                              ].map((btn) => {
                                                const isActive =
                                                  status === btn.s
                                                let activeClass = ''
                                                let inactiveClass = ''

                                                if (btn.color === 'yellow') {
                                                  activeClass =
                                                    'bg-orange-500 text-white shadow-md scale-110'
                                                  inactiveClass =
                                                    'bg-white border border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500'
                                                } else if (
                                                  btn.color === 'violet'
                                                ) {
                                                  activeClass =
                                                    'bg-purple-600 text-white shadow-md scale-110'
                                                  inactiveClass =
                                                    'bg-white border border-gray-200 text-gray-400 hover:border-purple-300 hover:text-purple-500'
                                                } else {
                                                  activeClass = `bg-${btn.color}-500 text-white shadow-md scale-110`
                                                  inactiveClass = `bg-white border border-gray-200 text-gray-400 hover:border-${btn.color}-300 hover:text-${btn.color}-500`
                                                }

                                                return (
                                                  <button
                                                    key={btn.s}
                                                    onClick={() => {
                                                      const newStatus = isActive
                                                        ? HomeworkStatus.PENDING
                                                        : btn.s
                                                      onUpdateStatus(
                                                        h.id,
                                                        studentId,
                                                        newStatus,
                                                      )
                                                    }}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                      isActive
                                                        ? activeClass
                                                        : inactiveClass
                                                    }`}
                                                    title={btn.label}
                                                  >
                                                    <i
                                                      className={`fas fa-${btn.icon}`}
                                                    ></i>
                                                  </button>
                                                )
                                              })}

                                              {/* WhatsApp Button */}
                                              <button
                                                onClick={async () => {
                                                  if (
                                                    sentMessages.has(
                                                      `${h.id}-${studentId}`,
                                                    )
                                                  )
                                                    return

                                                  const msg =
                                                    await generateParentMessage(
                                                      studentName,
                                                      h.title,
                                                      status || 'PENDING',
                                                      undefined, // schoolName
                                                      undefined, // teacherStatus
                                                      undefined, // userName
                                                      undefined, // isRenotify
                                                      h.assignedDate,
                                                      h.dueDate,
                                                      h.subject, // Added
                                                      h.description, // Added
                                                    )

                                                  if (student?.parentPhone) {
                                                    // Format phone: remove all non-digits
                                                    let phone =
                                                      student.parentPhone.replace(
                                                        /\D/g,
                                                        '',
                                                      )
                                                    // If starts with 0, remove it
                                                    if (phone.startsWith('0'))
                                                      phone = phone.substring(1)
                                                    // If valid turkish number (10 digits), add 90
                                                    if (phone.length === 10)
                                                      phone = '90' + phone

                                                    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
                                                    window.open(url, '_blank')

                                                    // Mark as sent
                                                    const newSet = new Set(
                                                      sentMessages,
                                                    )
                                                    newSet.add(
                                                      `${h.id}-${studentId}`,
                                                    )
                                                    setSentMessages(newSet)

                                                    toast.success(
                                                      'WhatsApp açılıyor... 🟢',
                                                    )
                                                  } else {
                                                    // Fallback to copy if no phone
                                                    navigator.clipboard.writeText(
                                                      msg,
                                                    )
                                                    toast.success(
                                                      'Telefon no bulunamadı, mesaj kopyalandı! 📋',
                                                    )
                                                  }
                                                }}
                                                disabled={sentMessages.has(
                                                  `${h.id}-${studentId}`,
                                                )}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ml-1 border ${
                                                  sentMessages.has(
                                                    `${h.id}-${studentId}`,
                                                  )
                                                    ? 'bg-green-100 border-green-300 text-green-700 cursor-default'
                                                    : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:text-green-700'
                                                }`}
                                                title={
                                                  sentMessages.has(
                                                    `${h.id}-${studentId}`,
                                                  )
                                                    ? 'Mesaj Gönderildi'
                                                    : 'WhatsApp ile Gönder'
                                                }
                                              >
                                                {sentMessages.has(
                                                  `${h.id}-${studentId}`,
                                                ) ? (
                                                  <i className="fas fa-check text-sm"></i>
                                                ) : (
                                                  <i className="fab fa-whatsapp text-lg"></i>
                                                )}
                                              </button>

                                              <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
                                              <button
                                                onClick={() => handleEdit(h)}
                                                className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 hover:text-indigo-600 flex items-center justify-center"
                                              >
                                                <i className="fas fa-edit text-xs"></i>
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </details>
                                </div>
                              )
                            },
                          )}
                        </div>
                      </details>
                    </div>
                  )
                })}

              {/* Ungrouped Homeworks */}
              {homeworks
                .filter(
                  (h) =>
                    (subjectFilter === 'ALL' || h.subject === subjectFilter) &&
                    !h.groupId &&
                    (turkishSearch(h.title, homeworkSearchTerm) ||
                      turkishSearch(h.description, homeworkSearchTerm)),
                )
                .map((h) => (
                  <div
                    key={h.id}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">
                          {h.title}
                        </h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-bold ${
                              h.subject === 'TURKCE'
                                ? 'bg-red-100 text-red-700'
                                : h.subject === 'MATEMATIK'
                                  ? 'bg-blue-100 text-blue-700'
                                  : h.subject === 'FEN'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {h.subject === 'TURKCE'
                              ? 'TÜRKÇE'
                              : h.subject === 'MATEMATIK'
                                ? 'MATEMATİK'
                                : h.subject === 'FEN'
                                  ? 'FEN'
                                  : h.subject || 'GENEL'}
                          </span>
                          {h.targetClasses.map((cls) => (
                            <span
                              key={cls}
                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded"
                            >
                              {cls}
                            </span>
                          ))}
                          {h.targetStudentIds &&
                            h.targetStudentIds.length > 0 && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                                {h.targetStudentIds.length} Öğrenci
                              </span>
                            )}
                        </div>
                        <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                          {h.description}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          Son Teslim:{' '}
                          {new Date(h.dueDate).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => setAnalyzingHomeworkIds([h.id])} // Single HW analysis
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors"
                          title="Analiz Et"
                        >
                          <i className="fas fa-chart-pie text-xl"></i>
                        </button>
                        <button
                          onClick={() => handleEdit(h)}
                          className="text-gray-400 hover:text-indigo-600 hover:bg-gray-50 p-2 rounded transition-colors"
                          title="Düzenle"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                'Bu ödevi silmek istediğinize emin misiniz?',
                              )
                            ) {
                              onDelete(h.id)
                              toast.success('Ödev silindi 🗑️')
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                          title="Sil"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>

      <PersonalizedHomeworkModal
        isOpen={showPersonalizedModal}
        onClose={() => setShowPersonalizedModal(false)}
        students={students}
        onAdd={handlePersonalizedAdd}
      />
    </div>
  )
}

export default HomeworkManager
