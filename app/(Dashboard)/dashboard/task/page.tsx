import TaskClient from '@/components/dashboard/TaskClient'
import React, { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

function TaskLoading() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500 font-medium">Loading tasks...</p>
            </div>
        </div>
    )
}

export default function page() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Task Management</h1>
            <Suspense fallback={<TaskLoading />}>
                <TaskClient />
            </Suspense>
        </div>
    )
}
