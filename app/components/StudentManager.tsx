'use client'

import React, { useState } from 'react'
import { Student } from '@/types'
import { db } from '@/services/db'
import { read, utils } from 'xlsx'
import toast from 'react-hot-toast'

interface Props {
  students: Student[]
  onAdd: (s: Student) => void
  onDelete: (id: string) => void
  onUpdate: (s: Student) => void
  onShowHistory?: (id: string) => void
}

const StudentManager: React.FC<Props> = ({
  students,
  onAdd,
  onDelete,
  onUpdate,
  onShowHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [name, setName] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [className, setClassName] = useState('')

  // Get unique existing classes for auto-suggestion
  const existingClasses = Array.from(
    new Set(students.map((s) => s.className)),
  ).sort()

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setName(student.name)
    setParentName(student.parentName)
    setParentPhone(student.parentPhone)
    setClassName(student.className)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancel = () => {
    setEditingStudent(null)
    setName('')
    setParentName('')
    setParentPhone('')
    setClassName('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !parentPhone || !className) return

    let cleanedPhone = parentPhone.replace(/\D/g, '')
    if (!cleanedPhone.startsWith('0')) cleanedPhone = '0' + cleanedPhone

    if (editingStudent) {
      onUpdate({
        ...editingStudent,
        name,
        parentName,
        parentPhone: cleanedPhone,
        className: className.toUpperCase(),
      })
      toast.success('Öğrenci bilgileri güncellendi 👤')
      handleCancel()
    } else {
      onAdd({
        id: Date.now().toString(),
        name,
        parentName,
        parentPhone: cleanedPhone,
        className: className.toUpperCase(),
      })
      toast.success('Yeni öğrenci eklendi 🎓')

      setName('')
      setParentName('')
      setParentPhone('')
      // Keep className selected for faster entry of next student in same class
    }
  }

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('Excel dosyası işleniyor...')

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = utils.sheet_to_json(ws)
        const newStudents: Student[] = []

        data.forEach((row: any) => {
          const studentName =
            row['Ad Soyad'] || row['Öğrenci Adı'] || row['Öğrenci']
          const studentClass = row['Sınıf'] || row['Sınıfı']
          const parentName = row['Veli'] || row['Veli Adı']
          const parentPhone =
            row['Veli Tel'] || row['Veli Telefon'] || row['Telefon']

          if (studentName && studentClass && parentPhone) {
            const cleanedPhone = String(parentPhone).replace(/\D/g, '')
            const student: Student = {
              id: (Date.now() + Math.random()).toString(),
              name: String(studentName).trim(),
              parentName: parentName ? String(parentName).trim() : '',
              parentPhone: cleanedPhone.startsWith('0')
                ? cleanedPhone
                : '0' + cleanedPhone,
              className: String(studentClass).trim().toUpperCase(),
            }
            newStudents.push(student)
          }
        })

        // Add to app state and perform a bulk sync to server
        if (newStudents.length > 0) {
          newStudents.forEach((s) => onAdd(s))

          // Attempt to sync: load existing state to keep homeworks
          ;(async () => {
            try {
              const current = await db.loadState()
              const merged = {
                students: [...(current.students || []), ...newStudents],
                homeworks: current.homeworks || [],
              }
              await db.saveState(merged)
            } catch (err) {
              console.error('Bulk sync after Excel import failed', err)
            }
          })()
          toast.success(`${newStudents.length} öğrenci başarıyla aktarıldı!`, {
            id: toastId,
          })
        } else {
          toast.error('Aktarılacak uygun öğrenci kaydı bulunamadı', {
            id: toastId,
          })
        }
      } catch (error) {
        console.error(error)
        toast.error('Excel dosyası işlenirken hata oluştu', { id: toastId })
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = '' // Clear input
  }

  return (
    <div className="space-y-6">
      <div
        className={`p-6 rounded-xl shadow-sm border transition-colors ${
          editingStudent
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-white border-slate-100'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-lg font-semibold ${
              editingStudent ? 'text-indigo-700' : 'text-slate-800'
            }`}
          >
            {editingStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
          </h2>
          {editingStudent && (
            <button
              type="button"
              onClick={handleCancel}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Vazgeç
            </button>
          )}
        </div>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Öğrenci Adı Soyadı"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <div className="relative">
            <input
              type="text"
              placeholder="Sınıf (Örn: 8/A)"
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              list="classes-list"
              required
            />
            <datalist id="classes-list">
              {existingClasses.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <input
            type="text"
            placeholder="Veli Adı Soyadı"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Veli Telefon (5xxxxxxxxx)"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={parentPhone}
            onChange={(e) => setParentPhone(e.target.value)}
            required
          />
          <button
            type="submit"
            className={`w-full md:col-span-2 text-white p-3 rounded-lg hover:opacity-90 transition font-medium ${
              editingStudent ? 'bg-amber-600' : 'bg-indigo-600'
            }`}
          >
            {editingStudent ? 'Değişiklikleri Kaydet' : 'Öğrenciyi Kaydet'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-slate-700 whitespace-nowrap">
              Öğrenci Listesi ({students.length})
            </h2>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleExcelImport}
                className="hidden"
                id="excel-upload"
              />
              <label
                htmlFor="excel-upload"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold cursor-pointer hover:bg-emerald-100 transition shadow-sm"
              >
                <i className="fas fa-file-excel"></i>
                EXCEL'DEN AKTAR
              </label>
            </div>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              placeholder="Öğrenci ara..."
              className="pl-9 pr-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
          {students.length === 0 ? (
            <div className="p-10 text-center text-slate-400 italic">
              Henüz öğrenci eklenmemiş.
            </div>
          ) : (
            students
              .filter(
                (s) =>
                  s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  s.className
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  s.parentName.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .sort(
                (a, b) =>
                  a.className.localeCompare(b.className) ||
                  a.name.localeCompare(b.name),
              )
              .map((s) => (
                <div
                  key={s.id}
                  className="p-4 flex justify-between items-center hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                        {s.className}
                      </span>
                      <h3 className="font-medium text-slate-900">{s.name}</h3>
                    </div>
                    <p className="text-sm text-slate-500">
                      Veli: {s.parentName} • {s.parentPhone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {onShowHistory && (
                      <button
                        onClick={() => onShowHistory(s.id)}
                        className="text-indigo-400 hover:text-indigo-600 p-2"
                        title="Geçmişi Gör"
                      >
                        <i className="fas fa-chart-line"></i>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-amber-400 hover:text-amber-600 p-2"
                    >
                      <i className="fas fa-pen"></i>
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            'Bu öğrenciyi silmek istediğinize emin misiniz?',
                          )
                        ) {
                          onDelete(s.id)
                          toast.success('Öğrenci silindi 🗑️')
                        }
                      }}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <i className="fas fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentManager
