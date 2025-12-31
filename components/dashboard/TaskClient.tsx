'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, formatApiError } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, PencilIcon, EyeIcon, CalendarIcon, X, Filter } from 'lucide-react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { DateRange } from 'react-day-picker'

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
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const router = useRouter()
    const searchParams = useSearchParams()

    // Filters - Initialize from URL params
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get('priority') || 'all')
    const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')

    // Determine initial date filter state
    const initialDate = searchParams.get('date')
    const initialStartDate = searchParams.get('start_date')
    const initialEndDate = searchParams.get('end_date')

    const [dateFilterType, setDateFilterType] = useState<'today' | 'specific' | 'range'>(
        initialDate ? 'specific' : (initialStartDate || initialEndDate ? 'range' : 'today')
    )
    const [specificDate, setSpecificDate] = useState<Date | undefined>(
        initialDate ? new Date(initialDate) : undefined
    )
    const [dateRange, setDateRange] = useState<DateRange | undefined>(
        initialStartDate ? {
            from: new Date(initialStartDate),
            to: initialEndDate ? new Date(initialEndDate) : undefined
        } : undefined
    )

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
            const params = new URLSearchParams()
            params.append('page', page.toString())

            if (searchQuery) params.append('search', searchQuery)
            if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter)
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

            // Date Filtering Logic
            if (dateFilterType === 'specific' && specificDate) {
                params.append('date', format(specificDate, 'yyyy-MM-dd'))
            } else if (dateFilterType === 'range' && dateRange?.from) {
                params.append('start_date', format(dateRange.from, 'yyyy-MM-dd'))
                if (dateRange.to) {
                    params.append('end_date', format(dateRange.to, 'yyyy-MM-dd'))
                }
            }
            // Default 'today' sends no params as per requirement "Default (no params): Shows only TODAY's tasks"
            // If we explicitly wanted today, we might send date=today, but let's stick to "no params" for default.

            // Update URL
            router.push(`?${params.toString()}`, { scroll: false })

            const data = await api.get<ApiResponse>(`/employee/tasks/?${params.toString()}`)
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
        fetchTasks(1) // Reset to page 1 on filter change
    }, [searchQuery, priorityFilter, statusFilter, dateFilterType, specificDate, dateRange])

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

    // Removed client-side filtering as we now do server-side filtering
    const filteredTasks = tasks

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
            {/* Filters Section */}
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-white border-gray-200"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        {/* Date Filter Type */}
                        <Select
                            value={dateFilterType}
                            onValueChange={(v: any) => {
                                setDateFilterType(v)
                                if (v === 'today') {
                                    setSpecificDate(undefined)
                                    setDateRange(undefined)
                                }
                            }}
                        >
                            <SelectTrigger className="w-[140px] h-10 bg-white border-gray-200">
                                <SelectValue placeholder="Date Filter" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="specific">Specific Date</SelectItem>
                                <SelectItem value="range">Date Range</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Specific Date Picker */}
                        {dateFilterType === 'specific' && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-[180px] h-10 justify-start text-left font-normal bg-white border-gray-200",
                                            !specificDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {specificDate ? format(specificDate, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={specificDate}
                                        onSelect={setSpecificDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}

                        {/* Date Range Picker */}
                        {dateFilterType === 'range' && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-[240px] h-10 justify-start text-left font-normal bg-white border-gray-200",
                                            !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                                    {format(dateRange.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        )}

                        {/* Priority Filter */}
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[130px] h-10 bg-white border-gray-200">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[130px] h-10 bg-white border-gray-200">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="todo">To Do</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="review">Review</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Reset Button */}
                        {(searchQuery || priorityFilter !== 'all' || statusFilter !== 'all' || dateFilterType !== 'today') && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                    setSearchQuery('')
                                    setPriorityFilter('all')
                                    setStatusFilter('all')
                                    setDateFilterType('today')
                                    setSpecificDate(undefined)
                                    setDateRange(undefined)
                                }}
                                className="h-10 w-10 text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                <CardContent className="!p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                                    <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredTasks.map((task) => (
                                    <tr key={task.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-gray-900 text-sm">{task.title}</span>
                                                <span className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">{task.description}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {task.assigned_to && task.assigned_to.length > 0 ? (
                                                    task.assigned_to.map((user, i) => (
                                                        <div
                                                            key={user.user_id}
                                                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600"
                                                            title={user.name}
                                                        >
                                                            {user.name.charAt(0)}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Unassigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                getPriorityColor(task.priority)
                                            )}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium border",
                                                getStatusColor(task.status)
                                            )}>
                                                {getStatusLabel(task.status)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-gray-600">
                                                {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    onClick={() => openViewDialog(task)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                    title="View Details"
                                                >
                                                    <EyeIcon size={16} />
                                                </Button>
                                                <Button
                                                    onClick={() => openEditDialog(task)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                    title="Update Status"
                                                >
                                                    <PencilIcon size={16} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredTasks.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Filter className="h-8 w-8 text-gray-300" />
                                                <p>No tasks found matching your filters</p>
                                            </div>
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
