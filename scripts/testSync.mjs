async function testSync() {
  const data = {
    students: [
      {
        id: 'test-student-1',
        name: 'Test Student',
        parentName: 'Parent',
        parentPhone: '05550000000',
        className: 'Test Class',
      },
    ],
    homeworks: [],
  }

  console.log('Posting state to http://localhost:4000/api/state...')
  try {
    const res = await fetch('http://localhost:4000/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    console.log('Response Status:', res.status)
    const result = await res.json()
    console.log('Result:', result)
  } catch (e) {
    console.error('Fetch failed:', e)
  }
}

testSync()
