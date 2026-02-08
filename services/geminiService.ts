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

interface HomeworkStatusItem {
  subject: string
  description: string
  status: string
}

export function generateCombinedParentMessage(
  studentName: string,
  homeworkItems: HomeworkStatusItem[],
  assignedDate?: string | Date,
  dueDate?: string | Date,
  schoolName?: string,
  teacherSubject?: string,
  userName?: string,
): string {
  const signature =
    schoolName || teacherSubject || userName
      ? `\n\n${schoolName || ''} ${teacherSubject ? `- ${teacherSubject}` : ''} ${userName ? `- ${userName}` : ''}`
      : ''

  // Format dates
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
    dateInfo = `${a} - ${d} tarihli`
  }

  // Subject name mapping
  const getSubjectName = (code: string) => {
    if (code === 'MATEMATIK') return 'Matematik'
    if (code === 'TURKCE') return 'Türkçe'
    if (code === 'FEN') return 'Fen Bilimleri'
    return code
  }

  // Build status lines with emojis
  const statusLines = homeworkItems.map((item) => {
    const subjectName = getSubjectName(item.subject)
    let emoji = '⏳'
    let statusText = 'Bekliyor'

    if (item.status === 'DONE') {
      emoji = '✅'
      statusText = 'Tamamlandı'
    } else if (item.status === 'MISSING') {
      emoji = '❌'
      statusText = 'Yapılmadı'
    } else if (item.status === 'INCOMPLETE') {
      emoji = '⚠️'
      statusText = 'Eksik'
    } else if (item.status === 'ABSENT') {
      emoji = '📦'
      statusText = 'Getirmedi'
    }

    return `${emoji} ${subjectName}: "${item.description}" - ${statusText}`
  })

  // Count issues
  const doneCount = homeworkItems.filter((i) => i.status === 'DONE').length
  const issueCount = homeworkItems.length - doneCount

  // Generate appropriate closing message
  let closingMessage = ''
  if (issueCount === 0) {
    closingMessage = `Tüm ek kaynak ödevlerini eksiksiz tamamladığını gördüm. Gösterdiği gayret için ${studentName}'i tebrik ederim. Desteğiniz için teşekkürler.`
  } else if (doneCount === 0) {
    closingMessage = `Ek kaynak ödevlerinin tamamlanması konusunda ${studentName}'e destek olmanızı rica ederim.`
  } else {
    closingMessage = `Eksik/yapılmamış ek kaynak ödevlerinin tamamlanması konusunda ${studentName}'e destek olmanızı rica ederim.`
  }

  return `Sayın Velimiz, ${studentName}'in ${dateInfo} ek kaynak ödevlerini kontrol ettiğimde:

${statusLines.join('\n')}

${closingMessage}
İyi günler dilerim.${signature}`
}
