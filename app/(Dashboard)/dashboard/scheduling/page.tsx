import { Metadata } from 'next'
import SchedulingClient from '@/components/dashboard/SchedulingClient'

export const metadata: Metadata = {
    title: 'Class Scheduling | Starat Dashboard',
    description: 'Manage class schedules',
}

export default function SchedulingPage() {
    return <SchedulingClient />
}
