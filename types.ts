export interface Student {
  id: string
  name: string
  parentName: string
  parentPhone: string
  className: string // Örn: "8/A", "6/B"
  bookDay?: string // 'PAZARTESI', 'SALI', 'CARSAMBA', 'PERSEMBE', 'CUMA'
}

export enum HomeworkStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  MISSING = 'MISSING',
  INCOMPLETE = 'INCOMPLETE',
  ABSENT = 'ABSENT',
}

export interface Homework {
  id: string
  title: string
  description: string
  assignedDate: string
  dueDate: string
  targetClasses: string[] // Bu ödev hangi sınıflar için?
  targetStudentIds?: string[] // Optional: for specific students
  subject?: string // 'TURKCE', 'MATEMATIK', 'FEN' or null
  groupId?: string // Optional: for grouping personalized homeworks
  submissions: { [studentId: string]: HomeworkStatus }
  notifiedStudents?: Record<string, boolean>
  createdAt?: string
}

export enum Subject {
  TURKCE = 'TURKCE',
  MATEMATIK = 'MATEMATIK',
  FEN = 'FEN',
  GENEL = 'GENEL',
}

export interface AppState {
  students: Student[]
  homeworks: Homework[]
}
