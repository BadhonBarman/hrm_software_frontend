import TaskClient from '@/components/dashboard/TaskClient'
import React from 'react'

export default function page() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Task Management</h1>
            <TaskClient />
        </div>
    )
}
