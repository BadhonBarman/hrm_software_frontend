import { Metadata } from 'next'
import ClassListClient from '@/components/dashboard/ClassListClient'

export const metadata: Metadata = {
    title: 'Classes | hrmian Dashboard',
    description: 'Manage classes information',
}

export default function ClassesPage() {
    return <ClassListClient />
}
