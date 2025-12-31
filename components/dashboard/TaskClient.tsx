'use client'

import React, { useEffect, useState } from 'react'
import { api, formatApiError } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, PencilIcon, EyeIcon } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface AssignedUser {
    user_id: number
    name: string
    branch: string | null
    department: string | null
    designation: string | null
    status: boolean
}

interface Task {
    id: number
    project: any | null
    project_detail: any | null
    title: string
    description: string
    assigned_to: AssignedUser[]
    priority: string
    status: string
    due_date: string
    created_at: string
    updated_at: string
}

interface ApiResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: Task[]
}

export default function TaskClient() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        due_date: '',
    })

    // Fetch tasks
    const fetchTasks = async (page = 1) => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.get<ApiResponse>(`/employee/tasks/?page=${page}`)
            setTasks(data.results)
            setCurrentPage(data.current_page)
            setTotalPages(data.total_pages)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks(currentPage)
    }, [currentPage])

    const openEditDialog = (task: Task) => {
        setSelectedTask(task)
        setFormData({
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            due_date: task.due_date ? task.due_date.split('T')[0] : '',
        })
        setIsEditDialogOpen(true)
    }

    const openViewDialog = (task: Task) => {
        setSelectedTask(task)
        setIsViewDialogOpen(true)
    }

    const handleEditTask = async () => {
        if (!selectedTask) return
        try {
            // We are sending the full object as it is a PUT request, 
            // but the user can only modify the status in the UI.
            await api.put(`/employee/tasks/${selectedTask.id}/`, formData)
            setIsEditDialogOpen(false)
            fetchTasks(currentPage)
            toast.success('Task updated successfully')
        } catch (err) {
            toast.error(formatApiError(err))
        }
    }

    const filteredTasks = tasks.filter(
        (task) =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200'
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'low': return 'text-green-600 bg-green-50 border-green-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'todo': return 'text-blue-600 bg-blue-50 border-blue-200'
            case 'in_progress': return 'text-purple-600 bg-purple-50 border-purple-200'
            case 'review': return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'completed': return 'text-green-600 bg-green-50 border-green-200'
            case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'todo': return 'To Do'
            case 'in_progress': return 'In Progress'
            case 'review': return 'Under Review'
            case 'completed': return 'Completed'
            case 'cancelled': return 'Cancelled'
            default: return status?.replace('_', ' ')
        }
    }

    return (
        <div className="space-y-6">
            {/* Search */}
            <div className='flex flex-row items-center gap-2.5 w-full'>
                <div className="relative w-full py-3.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search Task..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12"
                    />
                </div>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="!p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-600">Task Title</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Assigned To</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Priority</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Due Date</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.map((task) => (
                                    <tr key={task.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{task.title}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{task.description}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                {task.assigned_to && task.assigned_to.length > 0 ? (
                                                    task.assigned_to.map(user => (
                                                        <span key={user.user_id} className="text-sm text-gray-700">{user.name}</span>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-gray-400">Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                                {getStatusLabel(task.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => openViewDialog(task)}
                                                    variant="outline"
                                                    className='border-gray-800 px-2.5 py-3.5 rounded-lg'
                                                >
                                                    <EyeIcon size={16} className="mr-1" /> View
                                                </Button>
                                                <Button
                                                    onClick={() => openEditDialog(task)}
                                                    variant="outline"
                                                    className='border-gray-800 px-2.5 py-3.5 rounded-lg'
                                                >
                                                    <PencilIcon size={16} className="mr-1" /> Update Status
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-4 text-center text-gray-500">
                                            {loading ? 'Loading...' : 'No tasks found'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => (
                        <Button
                            key={i + 1}
                            variant={currentPage === i + 1 ? 'default' : 'outline'}
                            size="icon-sm"
                            onClick={() => setCurrentPage(i + 1)}
                            className={currentPage === i + 1 ? 'bg-blue-500 hover:bg-blue-600' : ''}
                        >
                            {i + 1}
                        </Button>
                    ))}
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Task Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todo">To Do</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="review">Under Review</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-[#00A4EF] hover:bg-[#0090d1]" onClick={handleEditTask}>Update Status</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Task Details</DialogTitle>
                    </DialogHeader>
                    {selectedTask && (
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label className="text-gray-500">Title</Label>
                                <div className="text-lg font-medium">{selectedTask.title}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-500">Priority</Label>
                                    <div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getPriorityColor(selectedTask.priority)}`}>
                                            {selectedTask.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-500">Status</Label>
                                    <div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                                            {getStatusLabel(selectedTask.status)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-500">Due Date</Label>
                                    <div>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : '-'}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-500">Assigned To</Label>
                                    <div className="flex flex-col gap-1">
                                        {selectedTask.assigned_to && selectedTask.assigned_to.length > 0 ? (
                                            selectedTask.assigned_to.map(user => (
                                                <span key={user.user_id} className="text-sm text-gray-700">{user.name}</span>
                                            ))
                                        ) : (
                                            <span className="text-sm text-gray-400">Unassigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-gray-500">Description</Label>
                                <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-wrap leading-relaxed border border-gray-100">
                                    {selectedTask.description}
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
