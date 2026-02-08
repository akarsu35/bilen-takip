'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface ProfileSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (profile: {
    fullName: string
    schoolName: string
    subject: string
  }) => void
}

export default function ProfileSetupModal({
  isOpen,
  onClose,
  onSave,
}: ProfileSetupModalProps) {
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, schoolName, subject }),
      })

      if (!response.ok) throw new Error('Failed to save profile')

      const data = await response.json()
      toast.success('Profil bilgileriniz kaydedildi!')
      onSave(data.profile)
      onClose()
    } catch (error) {
      console.error('Profile save error:', error)
      toast.error('Profil kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-600 text-white p-3 rounded-xl">
            <i className="fas fa-user-circle text-3xl"></i>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Profil Bilgileriniz
        </h2>
        <p className="text-center text-slate-500 mb-6">
          Veli mesajlarında kullanılmak üzere bilgilerinizi girebilirsiniz
          (isteğe bağlı)
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ad Soyad
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Cumhur Akarsu"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Çalıştığınız Kurum
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Bornova Bilnet"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Branş
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Matematik Öğretmeni"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-all"
            >
              Şimdi Değil
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
