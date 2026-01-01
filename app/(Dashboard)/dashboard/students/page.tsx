import { Metadata } from 'next'
import StudentListClient from '@/components/dashboard/StudentListClient'

export const metadata: Metadata = {
    title: 'Student | hrmian Dashboard',
    description: 'Manage student information',
}

export default function StudentPage() {
    return <StudentListClient />
}
