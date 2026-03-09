import ResourceAccessClient from '@/components/dashboard/ResourceAccessClient'
import React, { Suspense } from 'react'
import { Loader2, BookOpen } from 'lucide-react'

function ResourceLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 font-medium tracking-tight">Loading resources...</p>
        </div>
    )
}

export default function ResourceAccessPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen bg-gray-50/30">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Resource Access</h1>
                <p className="text-gray-500 flex items-center gap-2 text-sm">
                    <BookOpen size={14} />
                    View and manage your shared digital assets
                </p>
            </div>

            <Suspense fallback={<ResourceLoading />}>
                <ResourceAccessClient />
            </Suspense>
        </div>
    )
}
