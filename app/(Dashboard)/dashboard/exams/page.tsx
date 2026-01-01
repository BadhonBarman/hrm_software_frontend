import { Metadata } from 'next'
import ExamsClient from '@/components/dashboard/ExamsClient'

export const metadata: Metadata = {
    title: 'Exams & Results | hrmian Dashboard',
    description: 'Manage exams and view student results',
}

export default function ExamsPage() {
    return <ExamsClient />
}
