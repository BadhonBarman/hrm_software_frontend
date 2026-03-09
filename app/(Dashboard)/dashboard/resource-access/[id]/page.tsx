import ResourceAccessDetailsClient from '@/components/dashboard/ResourceAccessDetailsClient'
import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

function DetailsLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ResourceDetailsPage({ params }: PageProps) {
    const { id } = await params

    return (
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-50/30">
            <Suspense fallback={<DetailsLoading />}>
                <ResourceAccessDetailsClient id={id} />
            </Suspense>
        </div>
    )
}
