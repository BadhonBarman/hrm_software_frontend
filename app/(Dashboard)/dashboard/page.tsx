import React, { Suspense } from 'react'
import TaskClient from '@/components/dashboard/TaskClient'
import { Loader2 } from 'lucide-react'

function DashboardLoading() {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
            </div>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <TaskClient />
        </Suspense>
    )
}
