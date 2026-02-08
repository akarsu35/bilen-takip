function fallbackParentMessage(
  studentName: string,
  homeworkTitle: string,
  status: string,
  schoolName?: string,
  teacherStatus?: string,
  userName?: string,
  isRenotify?: boolean,
  assignedDate?: string | Date, // Added
  dueDate?: string | Date, // Added
  subject?: string, // Added
  description?: string, // Added
): string {
  const signature =
    schoolName || teacherStatus || userName
      ? `\n\n${schoolName || ''} - ${teacherStatus || ''} - ${userName || ''}`
      : ''

  // Format dates if provided
  let dateInfo = ''
  if (assignedDate && dueDate) {
    const a = new Date(assignedDate).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
    })
    const d = new Date(dueDate).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
    })
    dateInfo = `${a} - ${d} tarihli `
  }

  // Construct Homework Reference (Title replacement)
  // "Matematik dersi 10.02-17.02 tarihli Çarpım Tablosu konulu ödev"
  let homeworkRef = ''
  if (subject && description) {
    const subjName =
      subject === 'MATEMATIK'
        ? 'Matematik'
        : subject === 'TURKCE'
          ? 'Türkçe'
          : subject === 'FEN'
            ? 'Fen Bilimleri'
            : 'Genel'
    homeworkRef = `${subjName} dersi ${dateInfo}"${description}" konulu`
  } else {
    // Fallback to old title if subject/desc not properly passed
    homeworkRef = `"${homeworkTitle}"`
  }

  // Tamam (DONE) durumu için teşekkür mesajı
  if (status === 'DONE') {
    return `Sayın Velimiz, ${studentName}'in ${homeworkRef} ödevini kontrol ettiğimde ödevini eksiksiz ve özenli bir şekilde tamamladığını gördüm. Gösterdiği gayret ve sorumluluk bilinci için ${studentName}'i tebrik ederim. Desteğiniz için teşekkürler, iyi günler dilerim.${signature}`
  }

  // Getirmedi (ABSENT used as DID NOT BRING) durumu için özel mesaj
  if (status === 'ABSENT') {
    return `Sayın Velimiz, ${studentName} bugün okula geldiği halde ${homeworkRef} ödevini yanına almadığını/getirmediğini belirttiği için kontrolünü sağlayamadım. Öğrencimizin ödev takibi ve sorumluluk bilinci konusunda desteğinizi rica ederim. İyi günler dilerim.${signature}`
  }

  const detailText =
    status === 'MISSING'
      ? 'ödevin tamamlanması'
      : 'eksik kısımların tamamlanması'

  const statusText =
    status === 'MISSING' ? 'yapılmadığını' : 'bazı bölümlerin eksik kaldığını'

  // Tekrar bildirim için özel mesaj
  if (isRenotify) {
    return `Sayın Velimiz, daha önce bildirdiğimiz ${homeworkRef} ödevi halen ${statusText}. Konunun tam olarak pekişmesi ve öğrenme sürecinin aksamaması adına ${detailText} konusunda ${studentName}'e destek olmanızı rica ederim. İlginiz için teşekkürler, iyi günler dilerim.${signature}`
  }

  // Normal durum mesajları
  return `Sayın Velimiz, ${studentName}'in ${homeworkRef} ödevini kontrol ettiğimde ${statusText} fark ettim. Konunun tam olarak pekişmesi ve öğrenme sürecinin aksamaması adına ${detailText} konusunda ${studentName}'e destek olmanızı rica ederim. İlginiz için teşekkürler, iyi günler dilerim.${signature}`
}

export async function generateParentMessage(
  studentName: string,
  homeworkTitle: string,
  status: string,
  schoolName?: string,
  teacherStatus?: string,
  userName?: string,
  isRenotify?: boolean,
  assignedDate?: string | Date,
  dueDate?: string | Date,
  subject?: string,
  description?: string,
) {
  // AI feature disabled - using fallback message directly
  // To enable: Add GEMINI_API_KEY to .env and uncomment the code below
  return fallbackParentMessage(
    studentName,
    homeworkTitle,
    status,
    schoolName,
    teacherStatus,
    userName,
    isRenotify,
    assignedDate,
    dueDate,
    subject,
    description,
  )

  /* AI Feature (requires GEMINI_API_KEY in .env):
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateParentMessage',
        studentName,
        homeworkTitle,
        status,
      }),
    })
    if (!res.ok) throw new Error('AI API failed')
    const data = await res.json()
    return (
      data.text ||
      fallbackParentMessage(
        studentName,
        homeworkTitle,
        status,
        schoolName,
        teacherStatus,
        userName,
      )
    )
  } catch (error) {
    console.error('AI call failed, using fallback', error)
    return fallbackParentMessage(
      studentName,
      homeworkTitle,
      status,
      schoolName,
      teacherStatus,
      userName,
    )
  }
  */
}

export async function suggestHomeworkDescription(title: string) {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'suggestHomeworkDescription', title }),
    })
    if (!res.ok) throw new Error('AI API failed')
    const data = await res.json()
    return data.text || ''
  } catch (error) {
    console.error('AI suggestion failed', error)
    return ''
  }
}
