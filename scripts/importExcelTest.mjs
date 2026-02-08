import fs from 'fs'
import pkg from 'xlsx'
const { utils, write, readFile } = pkg

const outPath = '/tmp/test_import.xlsx'

// Create a simple workbook with headers matching StudentManager expectations
const rows = [
  ['Ad Soyad', 'Sınıf', 'Veli', 'Veli Tel'],
  ['Excel Öğrenci 1', '8/A', 'Veli 1', '05550123456'],
  ['Excel Öğrenci 2', '8/B', 'Veli 2', '05550987654'],
]

const ws = utils.aoa_to_sheet(rows)
const wb = { Sheets: { Sheet1: ws }, SheetNames: ['Sheet1'] }
const buf = write(wb, { bookType: 'xlsx', type: 'buffer' })
fs.writeFileSync(outPath, buf)
console.log('Wrote', outPath)

// Read the file back and parse like StudentManager
const wb2 = readFile(outPath)
const ws2 = wb2.Sheets[wb2.SheetNames[0]]
const data = utils.sheet_to_json(ws2)

const newStudents = []
for (const row of data) {
  const studentName = row['Ad Soyad'] || row['Öğrenci Adı'] || row['Öğrenci']
  const studentClass = row['Sınıf'] || row['Sınıfı']
  const parentName = row['Veli'] || row['Veli Adı']
  const parentPhone = row['Veli Tel'] || row['Veli Telefon'] || row['Telefon']
  if (studentName && studentClass && parentPhone) {
    const cleanedPhone = String(parentPhone).replace(/\D/g, '')
    const student = {
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
}

console.log('Parsed students:', newStudents.length)

// Fetch current state from server
const apiUrl =
  process.env.REACT_APP_API_URL || 'http://localhost:4000/api/state'

const getRes = await fetch(apiUrl)
let current = { students: [], homeworks: [] }
if (getRes.ok) {
  current = await getRes.json()
}

const merged = {
  students: [...(current.students || []), ...newStudents],
  homeworks: current.homeworks || [],
}

const postRes = await fetch(apiUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(merged),
})

console.log('POST status:', postRes.status)

const finalRes = await fetch(apiUrl)
const finalState = finalRes.ok ? await finalRes.json() : null
console.log('Final state summary: students=', finalState?.students?.length || 0)
console.log(JSON.stringify(finalState, null, 2))
