import { Metadata } from 'next'
import SubjectListClient from '@/components/dashboard/SubjectListClient'

export const metadata: Metadata = {
    title: 'Student | hrmian Dashboard',
    description: 'Manage student information',
}

export default function SubjectPage() {
    return <SubjectListClient />
}
