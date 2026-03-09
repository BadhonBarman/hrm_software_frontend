import FeedbackClient from '@/components/dashboard/FeedbackClient'
import React, { Suspense } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'

function FeedbackLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500 font-medium tracking-tight">Loading feedback history...</p>
        </div>
    )
}

export default function FeedbackPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8 min-h-screen bg-transparent">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Feedback Hub</h1>
                <p className="text-gray-500 flex items-center gap-2 text-sm font-medium">
                    <MessageSquare size={16} className="text-blue-500" />
                    Share your thoughts and help us improve
                </p>
            </div>

            <Suspense fallback={<FeedbackLoading />}>
                <FeedbackClient />
            </Suspense>
        </div>
    )
}
