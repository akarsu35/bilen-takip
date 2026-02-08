import { Student, Homework, AppState, HomeworkStatus } from '@/types'
import { getApiUrl } from './api-utils'

const STORAGE_KEY = 'odev_takip_v2'

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export const db = {
  async loadState(): Promise<AppState> {
    await delay(300)

    // If running in browser, prefer the local server API
    if (typeof window !== 'undefined') {
      try {
        const baseUrl = getApiUrl()
        console.log(`db.loadState: fetching from ${baseUrl}/api/state`)

        const res = await fetch(`${baseUrl}/api/state`).catch((err) => {
          console.error('db.loadState: fetch network error', err)
          throw new Error(
            'Ağ hatası: Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.',
          )
        })

        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = '/login'
            throw new Error('Oturum süresi doldu')
          }
          let errorMsg = `Sunucu Hatası (${res.status})`
          try {
            const errorJson = await res.json()
            if (errorJson.error) {
              errorMsg += `: ${errorJson.error}`
            }
          } catch (e) {
            errorMsg += ': Veriler yüklenemedi (JSON parse hatası)'
          }
          console.error(`db.loadState: API error ${res.status}`, errorMsg)
          throw new Error(errorMsg)
        }

        const state = await res.json()
        return {
          students: state.students || [],
          homeworks: state.homeworks || [],
        }
      } catch (e) {
        console.warn('Load failed, falling back to localStorage', e)
        const data = localStorage.getItem(STORAGE_KEY)
        if (!data) return { students: [], homeworks: [] }
        return JSON.parse(data)
      }
    }

    return { students: [], homeworks: [] }
  },

  async saveState(state: AppState): Promise<void> {
    if (typeof window !== 'undefined') {
      // Local storage backup
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

      try {
        const baseUrl = getApiUrl()
        const res = await fetch(`${baseUrl}/api/state`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state),
        })
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}))
          console.error(`db.saveState: API error ${res.status}`, errorData)
        } else {
          console.log('db.saveState: success')
        }
      } catch (e) {
        console.error('Remote sync failed:', e)
      }
    }
  },

  async exportData(): Promise<string> {
    const data =
      (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) ||
      '{"students":[], "homeworks":[]}'
    const blob = new Blob([data], { type: 'application/json' })
    return URL.createObjectURL(blob)
  },

  async importData(jsonString: string): Promise<void> {
    try {
      const parsed = JSON.parse(jsonString)
      if (Array.isArray(parsed.students) && Array.isArray(parsed.homeworks)) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, jsonString)
          window.location.reload()
        }
      } else {
        throw new Error('Geçersiz dosya formatı')
      }
    } catch (e) {
      alert('Hata: ' + (e as Error).message)
    }
  },
}
