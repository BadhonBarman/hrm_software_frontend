import { Metadata } from 'next'
import TeacherListClient from '@/components/dashboard/TeacherListClient'

export const metadata: Metadata = {
  title: 'Teachers | hrmian Dashboard',
  description: 'Manage teacher requests and active teachers',
}

export default function TeacherPage() {
  return <TeacherListClient />
}
