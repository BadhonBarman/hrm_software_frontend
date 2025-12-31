import { Metadata } from 'next'
import LessonPlanningClient from '@/components/dashboard/LessonPlanningClient'

export const metadata: Metadata = {
    title: 'Lesson Planning | Starat Dashboard',
    description: 'Manage lesson plans and homework',
}

export default function LessonPlanningPage() {
    return <LessonPlanningClient />
}
