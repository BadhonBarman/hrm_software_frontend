import { Metadata } from 'next'
import ClassListClient from '@/components/dashboard/ClassListClient'

export const metadata: Metadata = {
    title: 'Classes | Starat Dashboard',
    description: 'Manage classes information',
}

export default function ClassesPage() {
    return <ClassListClient />
}
