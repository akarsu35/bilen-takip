import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(req: Request) {
  try {
    const { action, ...data } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key missing' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    if (action === 'generateParentMessage') {
      const { studentName, homeworkTitle, status } = data
      const prompt = `Öğrenci: ${studentName}, Ödev: "${homeworkTitle}", Durum: ${status}. Aşağıdaki taslağa benzer, nazik ve profesyonel bir WhatsApp mesajı oluştur. Sadece mesaj metnini döndür.`
      const result = await model.generateContent(prompt)
      return NextResponse.json({ text: result.response.text() })
    }

    if (action === 'suggestHomeworkDescription') {
      const { title } = data
      const prompt = `${title} konusuyla ilgili ortaokul seviyesinde kısa bir ödev açıklaması yaz.`
      const result = await model.generateContent(prompt)
      return NextResponse.json({ text: result.response.text() })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    console.error('AI API failed', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
