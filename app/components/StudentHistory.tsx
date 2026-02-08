'use client'

import React, { useState, useMemo } from 'react'
import { Student, Homework, HomeworkStatus } from '@/types'

interface Props {
  students: Student[]
  homeworks: Homework[]
  initialStudentId: string | null
}

const StudentHistory: React.FC<Props> = ({
  students,
  homeworks,
  initialStudentId,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || '',
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<HomeworkStatus | 'ALL'>(
    'ALL',
  )
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date')

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId),
    [students, selectedStudentId],
  )

  const filteredStudents = useMemo(() => {
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.className.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, searchTerm])

  const processedHomeworks = useMemo(() => {
    if (!selectedStudent) return []

    return homeworks
      .filter((h) => {
        // If student is specifically targeted
        if (h.targetStudentIds && h.targetStudentIds.length > 0) {
          return h.targetStudentIds.includes(selectedStudent.id)
        }
        // Otherwise, check if their class is targeted
        return h.targetClasses.includes(selectedStudent.className)
      })
      .map((h) => ({
        ...h,
        studentStatus:
          h.submissions[selectedStudent.id] || HomeworkStatus.PENDING,
      }))
  }, [homeworks, selectedStudent])

  const studentHomeworks = useMemo(() => {
    let list = [...processedHomeworks]

    if (statusFilter !== 'ALL') {
      list = list.filter((h) => h.studentStatus === statusFilter)
    }

    return list.sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.assignedDate).getTime() -
          new Date(a.assignedDate).getTime()
        )
      } else {
        const order: Record<HomeworkStatus, number> = {
          [HomeworkStatus.MISSING]: 0,
          [HomeworkStatus.INCOMPLETE]: 1,
          [HomeworkStatus.ABSENT]: 2,
          [HomeworkStatus.PENDING]: 3,
          [HomeworkStatus.DONE]: 4,
        }
        return order[a.studentStatus] - order[b.studentStatus]
      }
    })
  }, [processedHomeworks, sortBy, statusFilter])

  const stats = useMemo(() => {
    if (processedHomeworks.length === 0) return null
    const done = processedHomeworks.filter(
      (h) => h.studentStatus === HomeworkStatus.DONE,
    ).length
    return {
      total: processedHomeworks.length,
      done,
      percentage: Math.round((done / processedHomeworks.length) * 100),
    }
  }, [processedHomeworks])

  return (
    <div className="space-y-6">
      {/* Student Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">
            Öğrenci Ara
          </label>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input
              type="text"
              placeholder="İsim veya sınıf ile ara..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/50 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider ml-1">
            Öğrenci Seçin
          </label>
          <select
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium shadow-sm"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <option value="">
              {filteredStudents.length > 0
                ? 'Öğrenci Seçin...'
                : 'Öğrenci Bulunamadı'}
            </option>
            {filteredStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedStudent ? (
        <>
          {/* Stats Bar */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="TOPLAM"
                value={stats.total}
                icon="fa-book"
                color="text-indigo-600"
              />
              <StatCard
                label="TAMAM"
                value={stats.done}
                icon="fa-check-circle"
                color="text-emerald-600"
              />
              <StatCard
                label="BAŞARI"
                value={`%${stats.percentage}`}
                icon="fa-rocket"
                color="text-orange-600"
              />
            </div>
          )}

          {/* List Controls */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Ödev Geçmişi</h2>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setSortBy('date')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    sortBy === 'date'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Tarih
                </button>
                <button
                  onClick={() => setSortBy('status')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition ${
                    sortBy === 'status'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  Durum
                </button>
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <FilterButton
                active={statusFilter === 'ALL'}
                onClick={() => setStatusFilter('ALL')}
                label="Hepsi"
                count={processedHomeworks.length}
              />
              <FilterButton
                active={statusFilter === HomeworkStatus.DONE}
                onClick={() => setStatusFilter(HomeworkStatus.DONE)}
                label="Tamamlandı"
                color="bg-emerald-500"
                count={
                  processedHomeworks.filter(
                    (h) => h.studentStatus === HomeworkStatus.DONE,
                  ).length
                }
              />
              <FilterButton
                active={statusFilter === HomeworkStatus.MISSING}
                onClick={() => setStatusFilter(HomeworkStatus.MISSING)}
                label="Yapılmadı"
                color="bg-red-500"
                count={
                  processedHomeworks.filter(
                    (h) => h.studentStatus === HomeworkStatus.MISSING,
                  ).length
                }
              />
              <FilterButton
                active={statusFilter === HomeworkStatus.INCOMPLETE}
                onClick={() => setStatusFilter(HomeworkStatus.INCOMPLETE)}
                label="Eksik"
                color="bg-orange-500"
                count={
                  processedHomeworks.filter(
                    (h) => h.studentStatus === HomeworkStatus.INCOMPLETE,
                  ).length
                }
              />
              <FilterButton
                active={statusFilter === HomeworkStatus.PENDING}
                onClick={() => setStatusFilter(HomeworkStatus.PENDING)}
                label="Bekliyor"
                color="bg-slate-400"
                count={
                  processedHomeworks.filter(
                    (h) => h.studentStatus === HomeworkStatus.PENDING,
                  ).length
                }
              />
              <FilterButton
                active={statusFilter === HomeworkStatus.ABSENT}
                onClick={() => setStatusFilter(HomeworkStatus.ABSENT)}
                label="Gelmedi"
                color="bg-purple-500"
                count={
                  processedHomeworks.filter(
                    (h) => h.studentStatus === HomeworkStatus.ABSENT,
                  ).length
                }
              />
            </div>
          </div>

          {/* Homework List */}
          <div className="space-y-3">
            {studentHomeworks.length === 0 ? (
              <div className="bg-white p-10 rounded-xl text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 italic">
                  Bu öğrenci için atanmış ödev bulunmuyor.
                </p>
              </div>
            ) : (
              studentHomeworks.map((hw) => (
                <div
                  key={hw.id}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-slate-800">{hw.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-black">
                      {new Date(hw.assignedDate).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                        hw.subject === 'TURKCE'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : hw.subject === 'MATEMATIK'
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : hw.subject === 'FEN'
                              ? 'bg-green-50 text-green-600 border-green-100'
                              : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}
                    >
                      {hw.subject === 'TURKCE'
                        ? 'TÜRKÇE'
                        : hw.subject === 'MATEMATIK'
                          ? 'NUM'
                          : hw.subject === 'FEN'
                            ? 'FEN'
                            : 'GENEL'}
                    </span>
                    <StatusBadge status={hw.studentStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="text-center p-20 opacity-40">
          <i className="fas fa-user-circle text-6xl mb-4 text-slate-300"></i>
          <p className="font-medium text-slate-500 italic">
            Geçmişi görüntülemek için bir öğrenci seçin.
          </p>
        </div>
      )}
    </div>
  )
}

const FilterButton: React.FC<{
  active: boolean
  onClick: () => void
  label: string
  color?: string
  count: number
}> = ({ active, onClick, label, color = 'bg-indigo-500', count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all whitespace-nowrap ${
      active
        ? `border-transparent ${color} text-white shadow-md scale-105`
        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
    }`}
  >
    <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
    <span
      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
        active ? 'bg-white/20' : 'bg-slate-100 text-slate-400'
      }`}
    >
      {count}
    </span>
  </button>
)

const StatCard: React.FC<{
  label: string
  value: string | number
  icon: string
  color: string
}> = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
    <div className={`text-xl mb-1 ${color}`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="text-lg font-black text-slate-800 leading-tight">
      {value}
    </div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </div>
  </div>
)

const StatusBadge: React.FC<{ status: HomeworkStatus }> = ({ status }) => {
  const configs: Record<HomeworkStatus, { label: string; class: string }> = {
    [HomeworkStatus.DONE]: {
      label: 'TAMAMLANDI',
      class: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    [HomeworkStatus.MISSING]: {
      label: 'YAPILMADI',
      class: 'bg-red-50 text-red-600 border-red-100',
    },
    [HomeworkStatus.INCOMPLETE]: {
      label: 'EKSİK',
      class: 'bg-orange-50 text-orange-600 border-orange-100',
    },
    [HomeworkStatus.ABSENT]: {
      label: 'GELMEDİ',
      class: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    [HomeworkStatus.PENDING]: {
      label: 'BEKLİYOR',
      class: 'bg-slate-50 text-slate-500 border-slate-100',
    },
  }

  const config = configs[status]
  return (
    <span
      className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${config.class}`}
    >
      {config.label}
    </span>
  )
}

export default StudentHistory
