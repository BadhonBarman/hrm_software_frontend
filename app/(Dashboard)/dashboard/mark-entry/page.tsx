import { Metadata } from 'next'
import MarkEntryClient from '@/components/dashboard/MarkEntryClient'

export const metadata: Metadata = {
    title: 'Mark Entry & Tracking | Starat Dashboard',
    description: 'Manage student marks and track performance',
}

export default function MarkEntryPage() {
    return <MarkEntryClient />
}
