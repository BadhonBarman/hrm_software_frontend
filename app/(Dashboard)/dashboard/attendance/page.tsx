import { Metadata } from 'next'
import AttendanceEntryClient from '@/components/dashboard/AttendanceEntryClient'

export const metadata: Metadata = {
  title: 'Attendance Entry | hrmian Dashboard',
  description: 'Mark student attendance for classes',
}

export default function AttendanceEntryPage() {
  return <AttendanceEntryClient />
}
