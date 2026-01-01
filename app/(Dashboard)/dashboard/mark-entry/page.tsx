import { Metadata } from 'next'
import MarkEntryClient from '@/components/dashboard/MarkEntryClient'

export const metadata: Metadata = {
    title: 'Mark Entry & Tracking | hrmian Dashboard',
    description: 'Manage student marks and track performance',
}

export default function MarkEntryPage() {
    return <MarkEntryClient />
}
