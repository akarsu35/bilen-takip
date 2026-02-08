'use client'

import React, { useState, useEffect } from 'react'
import { Student, Homework, HomeworkStatus } from '@/types'
import { Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

import { db } from '@/services/db'
import StudentManager from './components/StudentManager'
import HomeworkManager from './components/HomeworkManager'
import CheckPanel from './components/CheckPanel'
import Settings from './components/Settings'
import StudentHistory from './components/StudentHistory'
import ProfileSetupModal from './components/ProfileSetupModal'
import ProfileSettings from './components/ProfileSettings'

const Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'students' | 'homework' | 'check' | 'settings' | 'history'
  >('check')

  const router = useRouter()

  const handleLogout = async () => {
    localStorage.removeItem('odev_takip_v2')
    await fetch('/api/auth/logout', { method: 'POST' })
    router.refresh()
    router.push('/login')
  }
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  )
  const [students, setStudents] = useState<Student[]>([])
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [loading, setLoading] = useState(true)
  const [syncFailed, setSyncFailed] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const [user, setUser] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        setUser(data.user)

        // Check profile after user is loaded
        if (data.user) {
          checkUserProfile()
        } else {
          router.push('/login')
        }
      } catch (e) {
        console.error('Failed to get user', e)
        router.push('/login')
      }
    }
    getUser()
  }, [])

  const checkUserProfile = async () => {
    if (profileChecked) return

    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.profile)

        // Show modal if profile doesn't exist or is incomplete
        if (
          !data.profile ||
          (!data.profile.fullName &&
            !data.profile.schoolName &&
            !data.profile.subject)
        ) {
          // Only show modal once per session
          const hasSeenModal = sessionStorage.getItem('profileModalShown')
          if (!hasSeenModal) {
            setShowProfileModal(true)
            sessionStorage.setItem('profileModalShown', 'true')
          }
        }
      }
    } catch (error) {
      console.error('Profile check error:', error)
    } finally {
      setProfileChecked(true)
    }
  }

  const handleProfileSave = (profile: any) => {
    setUserProfile(profile)
  }

  useEffect(() => {
    const init = async () => {
      try {
        const state = await db.loadState()

        // Migration: Convert targetClass to targetClasses
        const migratedHomeworks = (state.homeworks || []).map((hw: any) => {
          if (hw.targetClass && !hw.targetClasses) {
            const { targetClass, ...rest } = hw
            return { ...rest, targetClasses: [targetClass] }
          }
          return hw
        })

        setStudents(state.students || [])
        setHomeworks(migratedHomeworks)
        setIsInitialized(true)
      } catch (e) {
        console.error('Initialization failed', e)
        setSyncFailed(true)
        const localData = localStorage.getItem('odev_takip_v2')
        if (localData) {
          const parsed = JSON.parse(localData)
          setStudents(parsed.students || [])
          setHomeworks(parsed.homeworks || [])
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (!loading && isInitialized && !syncFailed) {
      const savePromise = db.saveState({ students, homeworks })

      savePromise.catch((e) => {
        console.error('Auto-save failed', e)
        // We only show error toast to not annoy the user with too many success toasts
        // but we want to know if mobile sync fails.
      })
    }
  }, [students, homeworks, loading, isInitialized, syncFailed])

  const addStudent = (s: Student) => setStudents((prev) => [...prev, s])
  const deleteStudent = async (id: string) => {
    const previousStudents = students
    setStudents((prev) => prev.filter((s) => s.id !== id))

    try {
      const res = await fetch(`/api/student?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Silme işlemi başarısız')
    } catch (e) {
      console.error('Failed to delete student', e)
      setStudents(previousStudents)
      alert('Öğrenci silinemedi: ' + (e as Error).message)
    }
  }
  const updateStudent = (updatedStudent: Student) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)),
    )
  }

  const addHomework = (h: Homework) => setHomeworks((prev) => [h, ...prev])
  const deleteHomework = (id: string) => {
    setHomeworks((prev) => prev.filter((h) => h.id !== id))
  }
  const updateHomework = (updatedHomework: Homework) => {
    setHomeworks((prev) =>
      prev.map((h) => {
        if (h.id === updatedHomework.id) {
          return {
            ...updatedHomework,
            submissions: h.submissions,
            notifiedStudents: h.notifiedStudents,
          }
        }
        return h
      }),
    )
  }

  const updateSubmission = (
    hwId: string,
    studentId: string,
    status: HomeworkStatus,
  ) => {
    if (!hwId) return
    setHomeworks((prev) =>
      prev.map((hw) => {
        if (hw.id === hwId) {
          return {
            ...hw,
            submissions: { ...hw.submissions, [studentId]: status },
          }
        }
        return hw
      }),
    )
  }

  const markAsNotified = (hwId: string, studentId: string) => {
    if (!hwId) return
    setHomeworks((prev) =>
      prev.map((hw) => {
        if (hw.id === hwId) {
          return {
            ...hw,
            notifiedStudents: {
              ...(hw.notifiedStudents || {}),
              [studentId]: true,
            },
          }
        }
        return hw
      }),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium italic">
            Sınıflar Hazırlanıyor...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <Toaster position="top-right" />
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleProfileSave}
      />
      {/* Header */}
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-black text-indigo-600 flex items-center gap-2 tracking-tight">
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <i className="fas fa-check-double"></i>
            </div>
            ÖDEV TAKİP
          </h1>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 mr-2 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold">
                  {(user.email?.[0] || 'U').toUpperCase()}
                </div>
                <span className="text-xs font-medium text-indigo-900 max-w-[100px] truncate hidden sm:block">
                  {user.email}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
            >
              ÇIKIŞ
            </button>
            {syncFailed ? (
              <>
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest hidden sm:inline">
                  BAĞLANTI HATASI
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
                  BULUT DB
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {activeTab === 'students' && (
          <StudentManager
            students={students}
            onAdd={addStudent}
            onDelete={deleteStudent}
            onUpdate={updateStudent}
            onShowHistory={(id) => {
              setSelectedStudentId(id)
              setActiveTab('history')
            }}
          />
        )}
        {activeTab === 'homework' && (
          <HomeworkManager
            homeworks={homeworks}
            students={students}
            onAdd={addHomework}
            onDelete={deleteHomework}
            onUpdate={updateHomework}
            onUpdateStatus={updateSubmission}
          />
        )}
        {activeTab === 'check' && (
          <CheckPanel
            students={students}
            homeworks={homeworks}
            userProfile={userProfile}
            onUpdateStatus={updateSubmission}
            onMarkNotified={markAsNotified}
          />
        )}
        {activeTab === 'settings' && (
          <>
            <ProfileSettings />
            <div className="mt-4">
              <Settings state={{ students, homeworks }} />
            </div>
          </>
        )}
        {activeTab === 'history' && (
          <StudentHistory
            students={students}
            homeworks={homeworks}
            initialStudentId={selectedStudentId}
          />
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around p-3 pb-6 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50">
        <NavButton
          active={activeTab === 'check'}
          icon="fas fa-clipboard-list"
          label="Kontrol"
          onClick={() => setActiveTab('check')}
        />
        <NavButton
          active={activeTab === 'homework'}
          icon="fas fa-book"
          label="Ödevler"
          onClick={() => setActiveTab('homework')}
        />
        <NavButton
          active={activeTab === 'students'}
          icon="fas fa-user-graduate"
          label="Öğrenciler"
          onClick={() => setActiveTab('students')}
        />
        <NavButton
          active={activeTab === 'history'}
          icon="fas fa-chart-line"
          label="Gelişim"
          onClick={() => setActiveTab('history')}
        />
        <NavButton
          active={activeTab === 'settings'}
          icon="fas fa-cog"
          label="Ayarlar"
          onClick={() => setActiveTab('settings')}
        />
      </nav>
    </div>
  )
}

const NavButton: React.FC<{
  active: boolean
  icon: string
  label: string
  onClick: () => void
}> = ({ active, icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${
      active ? 'text-indigo-600 scale-110' : 'text-slate-400'
    }`}
  >
    <div className={`p-1.5 rounded-xl ${active ? 'bg-indigo-50' : ''}`}>
      <i className={`${icon} text-lg`}></i>
    </div>
    <span className="text-[10px] font-bold uppercase tracking-wider">
      {label}
    </span>
  </button>
)

export default Page
