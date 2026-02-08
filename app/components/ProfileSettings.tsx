'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

interface UserProfile {
  id: string
  userId: string
  fullName: string | null
  schoolName: string | null
  subject: string | null
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to load profile')

      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)
        setFullName(data.profile.fullName || '')
        setSchoolName(data.profile.schoolName || '')
        setSubject(data.profile.subject || '')
      }
    } catch (error) {
      console.error('Profile load error:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, schoolName, subject }),
      })

      if (!response.ok) throw new Error('Failed to save profile')

      const data = await response.json()
      setProfile(data.profile)
      setIsEditing(false)
      toast.success('Profil bilgileriniz güncellendi!')
    } catch (error) {
      console.error('Profile save error:', error)
      toast.error('Profil güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFullName(profile.fullName || '')
      setSchoolName(profile.schoolName || '')
      setSubject(profile.subject || '')
    }
    setIsEditing(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i className="fas fa-user-circle text-indigo-600"></i>
          Profil Bilgilerim
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <i className="fas fa-edit mr-1"></i>
            Düzenle
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Ad Soyad
          </label>
          {isEditing ? (
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Cumhur Akarsu"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          ) : (
            <p className="text-slate-600 px-4 py-2 bg-slate-50 rounded-lg">
              {profile?.fullName || 'Belirtilmemiş'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Çalıştığınız Kurum
          </label>
          {isEditing ? (
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Bornova Bilnet"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
            />
          ) : (
            <p className="text-slate-600 px-4 py-2 bg-slate-50 rounded-lg">
              {profile?.schoolName || 'Belirtilmemiş'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Branş
          </label>
          {isEditing ? (
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Matematik Öğretmeni"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          ) : (
            <p className="text-slate-600 px-4 py-2 bg-slate-50 rounded-lg">
              {profile?.subject || 'Belirtilmemiş'}
            </p>
          )}
        </div>

        {isEditing && (
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCancel}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 rounded-lg transition-all"
            >
              İptal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
              ) : (
                'Kaydet'
              )}
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <i className="fas fa-info-circle mr-1"></i>
          Bu bilgiler veli mesajlarında kullanılır. İsteğe bağlıdır.
        </p>
      </div>
    </div>
  )
}
