import { Metadata } from 'next'
import LessonNotesClient from '@/components/dashboard/LessonNotesClient'

export const metadata: Metadata = {
    title: 'Lesson Notes | Starat Dashboard',
    description: 'Manage lesson notes and homework',
}

export default function LessonPlanningPage() {
    return <LessonNotesClient />
}
