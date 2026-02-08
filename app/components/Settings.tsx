'use client'

import React from 'react'
import { db } from '@/services/db'
import { AppState } from '@/types'

interface Props {
  state: AppState
}

const Settings: React.FC<Props> = ({ state }) => {
  const handleExport = async () => {
    const url = await db.exportData()
    const a = document.createElement('a')
    a.href = url
    a.download = `odev_takip_yedek_${new Date().toISOString().split('T')[0]}.json`
    a.click()
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const content = event.target?.result as string
      await db.importData(content)
    }
    reader.readAsText(file)
  }

  const clearAll = () => {
    if (
      confirm(
        'Tüm verileri silmek istediğinize emin misiniz? Bu işlem geri alınamaz!',
      )
    ) {
      localStorage.clear()
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-database text-indigo-500"></i>
          Veritabanı Yönetimi
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
              Öğrenci Sayısı
            </span>
            <span className="text-2xl font-black text-slate-700">
              {state.students.length}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase block mb-1">
              Toplam Ödev
            </span>
            <span className="text-2xl font-black text-slate-700">
              {state.homeworks.length}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition font-semibold"
          >
            <span className="flex items-center gap-3">
              <i className="fas fa-file-export"></i>
              Veritabanını Yedekle (JSON)
            </span>
            <i className="fas fa-chevron-right text-xs"></i>
          </button>

          <label className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition font-semibold cursor-pointer">
            <span className="flex items-center gap-3">
              <i className="fas fa-file-import"></i>
              Yedek Geri Yükle
            </span>
            <input
              type="file"
              className="hidden"
              accept=".json"
              onChange={handleImport}
            />
            <i className="fas fa-chevron-right text-xs"></i>
          </label>

          <button
            onClick={clearAll}
            className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition font-semibold mt-8"
          >
            <span className="flex items-center gap-3">
              <i className="fas fa-trash-alt"></i>
              Veritabanını Sıfırla
            </span>
          </button>
        </div>
      </div>

      <div className="p-4 text-center">
        <p className="text-xs text-slate-400">
          Verileriniz bu tarayıcıda yerel olarak saklanmaktadır.
        </p>
        <p className="text-xs text-slate-400 mt-1">Sürüm 2.1.0-beta</p>
      </div>
    </div>
  )
}

export default Settings
