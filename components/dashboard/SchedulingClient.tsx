'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, X, Clock, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { api, formatApiError } from '@/lib/api-client'

interface Schedule {
    id: number
    teacher: number
    subject: number
    subject_name: string
    day: string
    start_time: string
    end_time: string
    repeat_week: number
    created: string
}

interface Subject {
    id: number
    name: string
    code: string
    subject_class: {
        id: number
        name: string
    }
}

interface ScheduleItem {
    subject: number
    subject_name: string
    start_time: string
    end_time: string
}

interface ApiResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: Schedule[]
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SchedulingClient() {
    const [searchQuery, setSearchQuery] = useState('')
    const [currentTab, setCurrentTab] = useState<'lesson' | 'homework'>('lesson')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [lessonSchedules, setLessonSchedules] = useState<Schedule[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
    const [selectedDay, setSelectedDay] = useState<string>('')
    const [selectedSubject, setSelectedSubject] = useState<number | null>(null)
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [repeatWeek, setRepeatWeek] = useState(1)
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([])
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState('')
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [scheduleToDelete, setScheduleToDelete] = useState<Schedule | null>(null)

    /** ---------------- Fetch Data ---------------- **/

    const fetchSchedules = async (page = 1) => {
        setLoading(true)
        try {
            const data = await api.get<ApiResponse>(`/schedules/?page=${page}`)
            setLessonSchedules(data.results)
            setCurrentPage(data.current_page)
            setTotalPages(data.total_pages)
        } catch (err) {
            console.error(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const data = await api.get<{ total_subject: number; subjects: Subject[] }>('/subjects/summary/')
            setSubjects(data.subjects)
        } catch (err) {
            console.error(formatApiError(err))
        }
    }

    useEffect(() => {
        if (currentTab === 'lesson') {
            fetchSchedules(currentPage)
            fetchSubjects()
        }
    }, [currentPage, currentTab])

    /** ---------------- Filter & Pagination ---------------- **/

    const filteredSchedules = lessonSchedules.filter(
        (schedule) =>
            schedule.day.toLowerCase().includes(searchQuery.toLowerCase()) ||
            schedule.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const itemsPerPage = 5
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage

    /** ---------------- Dialog Handlers ---------------- **/

    const openManageDialog = () => {
        setSelectedDay('')
        setSelectedSubject(null)
        setStartTime('')
        setEndTime('')
        setRepeatWeek(1)
        setScheduleItems([])
        setMessage('')
        setIsManageDialogOpen(true)
    }

    const handleDaySelect = (day: string) => {
        setSelectedDay(day)
    }

    const handleAddScheduleItem = () => {
        if (selectedSubject && startTime && endTime) {
            const subject = subjects.find(s => s.id === selectedSubject)
            if (subject) {
                setScheduleItems([...scheduleItems, {
                    subject: selectedSubject,
                    subject_name: subject.name,
                    start_time: startTime,
                    end_time: endTime
                }])
                setSelectedSubject(null)
                setStartTime('')
                setEndTime('')
            }
        }
    }

    const handleRemoveScheduleItem = (index: number) => {
        setScheduleItems(scheduleItems.filter((_, i) => i !== index))
    }

    const handleSaveSchedule = async () => {
        if (!selectedDay || scheduleItems.length === 0) {
            setMessage('Please select a day and add at least one schedule item')
            return
        }

        setSaving(true)
        setMessage('')

        try {
            // Create schedule for each item
            for (const item of scheduleItems) {
                await api.post('/schedules/', {
                    day: selectedDay,
                    start_time_input: item.start_time,
                    end_time_input: item.end_time,
                    repeat_week: repeatWeek,
                    subject: item.subject
                })
            }

            setMessage('Schedule created successfully')
            setIsManageDialogOpen(false)
            setScheduleItems([])
            setSelectedDay('')
            fetchSchedules(currentPage)
        } catch (err) {
            setMessage(formatApiError(err))
        } finally {
            setSaving(false)
        }
    }

    const openDeleteDialog = (schedule: Schedule) => {
        setScheduleToDelete(schedule)
        setIsDeleteDialogOpen(true)
    }

    const handleDeleteSchedule = async () => {
        if (!scheduleToDelete) return

        setSaving(true)
        setMessage('')

        try {
            await api.delete(`/schedules/${scheduleToDelete.id}/`)
            setMessage('Schedule deleted successfully')
            setIsDeleteDialogOpen(false)
            setScheduleToDelete(null)
            fetchSchedules(currentPage)
        } catch (err) {
            setMessage(formatApiError(err))
        } finally {
            setSaving(false)
        }
    }

    /** ---------------- Format Time ---------------- **/

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        })
    }

    /** ---------------- Auto-dismiss message ---------------- **/

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000)
            return () => clearTimeout(timer)
        }
    }, [message])

    /** ---------------- Render Table ---------------- **/

    const renderTable = () => (
        <Card>
            <CardContent className="p-0">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b bg-gray-50">
                            <tr>
                                <th className="text-left p-4 font-medium text-gray-600">Day</th>
                                <th className="text-left p-4 font-medium text-gray-600">Subject name</th>
                                <th className="text-left p-4 font-medium text-gray-600">Start time</th>
                                <th className="text-left p-4 font-medium text-gray-600">End time</th>
                                <th className="text-left p-4 font-medium text-gray-600">Date</th>
                                <th className="text-left p-4 font-medium text-gray-600">Repeat Weeks</th>
                                <th className="text-left p-4 font-medium text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredSchedules.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        No schedules found
                                    </td>
                                </tr>
                            ) : (
                                filteredSchedules.map((schedule) => (
                                    <tr key={schedule.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                        <td className="p-4 font-medium">{schedule.day}</td>
                                        <td className="p-4 text-gray-600">{schedule.subject_name}</td>
                                        <td className="p-4 text-gray-600">{formatTime(schedule.start_time)}</td>
                                        <td className="p-4 text-gray-600">{formatTime(schedule.end_time)}</td>
                                        <td className="p-4 text-gray-600">{formatDate(schedule.start_time)}</td>
                                        <td className="p-4 text-gray-600">{schedule.repeat_week}</td>
                                        <td className="p-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openDeleteDialog(schedule)}
                                                className="border-red-300 text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Loading...</div>
                    ) : filteredSchedules.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No schedules found</div>
                    ) : (
                        filteredSchedules.map((schedule) => (
                            <div key={schedule.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium">{schedule.day}</p>
                                        <p className="text-sm text-gray-600 mt-1">{schedule.subject_name}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <span>Start: {formatTime(schedule.start_time)}</span>
                                    <span>End: {formatTime(schedule.end_time)}</span>
                                    <span className="col-span-2">Date: {formatDate(schedule.start_time)}</span>
                                    <span className="col-span-2">Repeat: {schedule.repeat_week} weeks</span>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDeleteDialog(schedule)}
                                    className="border-red-300 text-red-600 hover:bg-red-50 w-full"
                                >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            {/* Message Banner */}
            {message && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
                    {message}
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="lesson" onValueChange={(value) => setCurrentTab(value as 'lesson' | 'homework')}>
                <div>
                    <div className='flex flex-row items-center gap-2.5 w-full'>
                        {/* Search */}
                        <div className="relative w-full py-3.5">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search schedule"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 h-12"
                            />
                        </div>

                        {/* Add Button */}
                        <Button
                            onClick={openManageDialog}
                            className="bg-[#00A4EF] cursor-pointer h-12 hover:bg-[#0090d1] text-white w-full sm:w-auto"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {currentTab === 'lesson' ? 'Manage Schedule' : 'Add Homework'}
                        </Button>
                    </div>
{/* 
                    <TabsList>
                        <TabsTrigger value="lesson">Lesson Plan</TabsTrigger>
                        <TabsTrigger value="homework">Homework</TabsTrigger>
                    </TabsList> */}
                </div>

                <TabsContent value="lesson" className="mt-0">
                    {renderTable()}
                </TabsContent>

                <TabsContent value="homework" className="mt-0">
                    <Card>
                        <CardContent className="p-8 text-center text-gray-500">
                            Homework feature coming soon
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Pagination */}
            {currentTab === 'lesson' && filteredSchedules.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredSchedules.length)} of{' '}
                        {filteredSchedules.length} results
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                                pageNum = i + 1
                            } else if (currentPage <= 3) {
                                pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                            } else {
                                pageNum = currentPage - 2 + i
                            }
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={currentPage === pageNum ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                >
                                    {pageNum}
                                </Button>
                            )
                        })}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <span className="text-gray-400">...</span>
                        )}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
                                {totalPages}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Manage Schedule Dialog */}
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Manage Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Day Selection */}
                        <div className="space-y-2">
                            <Label>Select Day</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {daysOfWeek.map((day) => (
                                    <Button
                                        key={day}
                                        variant={selectedDay === day ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => handleDaySelect(day)}
                                        className={`text-xs h-9 cursor-pointer ${selectedDay === day ? 'bg-[#00A4EF] hover:bg-[#0090d1]' : ''}`}
                                    >
                                        {day.slice(0, 3)}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Repeat Week */}
                        <div className="space-y-2">
                            <Label htmlFor="repeatWeek">Repeat for weeks</Label>
                            <Input
                                id="repeatWeek"
                                type="number"
                                min="1"
                                className='w-full !h-12'
                                value={repeatWeek}
                                onChange={(e) => setRepeatWeek(parseInt(e.target.value) || 1)}
                            />
                        </div>

                        {/* Subject Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="subject">Select subject</Label>
                            <Select 
                                value={selectedSubject?.toString() || ''} 
                                onValueChange={(value) => setSelectedSubject(parseInt(value))}
                            >
                                <SelectTrigger className="w-full !h-12">
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id.toString()}>
                                            {subject.name} ({subject.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Time Selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start time</Label>
                                <div className="relative">
                                    <Input
                                        id="startTime"
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                    />
                                    {/* <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /> */}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End time</Label>
                                <div className="relative">
                                    <Input
                                        id="endTime"
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                    {/* <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /> */}
                                </div>
                            </div>
                        </div>

                        {/* Add Button */}
                        <Button
                            onClick={handleAddScheduleItem}
                            disabled={!selectedSubject || !startTime || !endTime}
                            className={`w-full ${selectedSubject && startTime && endTime
                                ? 'bg-[#00A4EF] hover:bg-[#0090d1]'
                                : 'bg-gray-300'
                                }`}
                        >
                            Add
                        </Button>

                        {/* Schedule Items List */}
                        {scheduleItems.length > 0 && (
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {scheduleItems.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.subject_name}</p>
                                            <p className="text-xs text-gray-600 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {item.start_time} — {item.end_time}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveScheduleItem(index)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManageDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveSchedule}
                            disabled={!selectedDay || scheduleItems.length === 0 || saving}
                            className="bg-[#00A4EF] hover:bg-[#0090d1]"
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600">
                            Are you sure you want to delete this schedule?
                        </p>
                        {scheduleToDelete && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                                <p className="font-medium">{scheduleToDelete.day}</p>
                                <p className="text-sm text-gray-600">Subject: {scheduleToDelete.subject_name}</p>
                                <p className="text-sm text-gray-600">
                                    Time: {formatTime(scheduleToDelete.start_time)} - {formatTime(scheduleToDelete.end_time)}
                                </p>
                                <p className="text-sm text-gray-600">Repeat: {scheduleToDelete.repeat_week} weeks</p>
                            </div>
                        )}
                        <p className="mt-4 text-sm text-red-600">
                            This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsDeleteDialogOpen(false)
                                setScheduleToDelete(null)
                            }}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteSchedule}
                            disabled={saving}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {saving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}