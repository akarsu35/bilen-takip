'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'İşlem başarısız')
      }

      toast.success(isSignUp ? 'Hesap oluşturuldu!' : 'Giriş başarılı!')
      router.refresh()
      router.push('/')
    } catch (error: any) {
      console.error('Auth error:', error)
      if (
        error.status === 429 ||
        error.message?.includes('Too Many Requests') ||
        error.message?.includes('429')
      ) {
        toast.error(
          'Çok fazla deneme yaptınız. Lütfen 1-2 dakika bekleyip tekrar deneyin.',
          {
            duration: 5000,
          },
        )
      } else {
        toast.error('Hata: ' + (error.message || 'Bir sorun oluştu'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-center mb-8">
          <div className="bg-indigo-600 text-white p-3 rounded-xl">
            <i className="fas fa-check-double text-2xl"></i>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
        </h2>
        <p className="text-center text-slate-500 mb-8">
          {isSignUp
            ? 'Ödev Takip sistemine katılın'
            : 'Öğrenci ve ödevlerinizi yönetmek için giriş yapın'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : isSignUp ? (
              'Kayıt Ol'
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {isSignUp
              ? 'Zaten hesabınız var mı? Giriş yapın'
              : 'Hesabınız yok mu? Hemen oluşturun'}
          </button>
        </div>
      </div>
    </div>
  )
}
