'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Search, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { api, formatApiError } from '@/lib/api-client'
import { toast } from 'sonner'

interface Student {
    student: number
    student_name: string
    student_roll: string
    status: 'present' | 'absent'
}

interface AttendanceSheet {
    teacher_class: number
    date: string
    students: Student[]
    is_new: boolean
}

interface ClassInfo {
    id: number
    name: string
    teacher_name: string
    total_students: number
}

export default function AttendanceEntryClient() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedClass, setSelectedClass] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [students, setStudents] = useState<Student[]>([])
    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isNewAttendance, setIsNewAttendance] = useState(true)
    const itemsPerPage = 5

    // Fetch classes on mount
    useEffect(() => {
        fetchClasses()
    }, [])

    // Fetch attendance when class or date changes
    useEffect(() => {
        if (selectedClass && selectedDate) {
            fetchAttendance()
        }
    }, [selectedClass, selectedDate])

    const fetchClasses = async () => {
        try {
            const response = await api.get<{ classes: ClassInfo[] }>('/classes/summary/')
            setClasses(response.classes)
        } catch (error) {
            toast.error('Failed to load classes', {
                description: formatApiError(error)
            })
        }
    }

    const fetchAttendance = async () => {
        setLoading(true)
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const response = await api.get<AttendanceSheet>(
                `/attendance/get_attendance_sheet/?class_id=${selectedClass}&date=${dateStr}`
            )
            setStudents(response.students)
            setIsNewAttendance(response.is_new)
            setCurrentPage(1) // Reset to first page
        } catch (error) {
            toast.error('Failed to load attendance', {
                description: formatApiError(error)
            })
            setStudents([])
        } finally {
            setLoading(false)
        }
    }

    const handleSaveAttendance = async () => {
        if (!selectedClass || !selectedDate) {
            toast.error('Missing Information', {
                description: 'Please select both class and date'
            })
            return
        }

        setSaving(true)
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            const payload = {
                teacher_class: parseInt(selectedClass),
                date: dateStr,
                students: students.map(s => ({
                    student: s.student,
                    status: s.status
                }))
            }

            await api.post('/attendance/', payload)
            
            toast.success('Attendance saved successfully')
            
            setIsNewAttendance(false)
        } catch (error) {
            toast.error('Failed to save attendance', {
                description: formatApiError(error)
            })
        } finally {
            setSaving(false)
        }
    }

    // Filter students based on search
    const filteredStudents = students.filter(
        (student) =>
            student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.student_roll.includes(searchQuery)
    )

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentStudents = filteredStudents.slice(startIndex, endIndex)

    const handleStatusChange = (studentId: number, newStatus: 'present' | 'absent') => {
        setStudents((prev) =>
            prev.map((student) =>
                student.student === studentId ? { ...student, status: newStatus } : student
            )
        )
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center w-full gap-4">
                {/* Date Picker */}
                <div className="flex-1 w-full">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full h-12 justify-start text-left font-normal',
                                    !selectedDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'PPP') : <span>Select date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Class Selector */}
                <div className="w-full sm:w-auto">
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="h-12 w-full sm:w-62 cursor-pointer">
                            <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name} ({cls.total_students} students)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Show content only when class is selected */}
            {selectedClass ? (
                <>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search students by name or roll"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>

                    {loading ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">Loading attendance...</p>
                            </CardContent>
                        </Card>
                    ) : students.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <p className="text-gray-500">No students found in this class</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Save Button */}
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSaveAttendance}
                                    disabled={saving}
                                    className="bg-blue-500 hover:bg-blue-600"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {saving ? 'Saving...' : isNewAttendance ? 'Save Attendance' : 'Update Attendance'}
                                </Button>
                            </div>

                            {/* Table */}
                            <Card>
                                <CardContent className="p-0">
                                    {/* Desktop Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="border-b bg-gray-50">
                                                <tr>
                                                    <th className="text-left p-4 font-medium text-gray-600">Name</th>
                                                    <th className="text-left p-4 font-medium text-gray-600">Roll</th>
                                                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                                                    <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentStudents.map((student) => (
                                                    <tr key={student.student} className="border-b last:border-b-0 hover:bg-gray-50">
                                                        <td className="p-4">{student.student_name}</td>
                                                        <td className="p-4 text-gray-600">{student.student_roll}</td>
                                                        <td className="p-4">
                                                            <Badge
                                                                variant={student.status === 'present' ? 'default' : 'destructive'}
                                                                className={
                                                                    student.status === 'present'
                                                                        ? 'bg-green-500 hover:bg-green-600'
                                                                        : 'bg-red-500 hover:bg-red-600'
                                                                }
                                                            >
                                                                {student.status === 'present' ? 'Present' : 'Absent'}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant={student.status === 'present' ? 'default' : 'outline'}
                                                                    onClick={() => handleStatusChange(student.student, 'present')}
                                                                    className={
                                                                        student.status === 'present'
                                                                            ? 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                                                                            : 'border-green-500 text-green-600 hover:bg-green-50'
                                                                    }
                                                                >
                                                                    👍 Present
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={student.status === 'absent' ? 'default' : 'outline'}
                                                                    onClick={() => handleStatusChange(student.student, 'absent')}
                                                                    className={
                                                                        student.status === 'absent'
                                                                            ? 'bg-red-500 hover:bg-red-600 text-white border-red-500'
                                                                            : 'border-red-500 text-red-600 hover:bg-red-50'
                                                                    }
                                                                >
                                                                    👎 Absent
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden divide-y">
                                        {currentStudents.map((student) => (
                                            <div key={student.student} className="p-4 space-y-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium">{student.student_name}</p>
                                                        <p className="text-sm text-gray-600">Roll: {student.student_roll}</p>
                                                    </div>
                                                    <Badge
                                                        variant={student.status === 'present' ? 'default' : 'destructive'}
                                                        className={
                                                            student.status === 'present'
                                                                ? 'bg-green-500 hover:bg-green-600'
                                                                : 'bg-red-500 hover:bg-red-600'
                                                        }
                                                    >
                                                        {student.status === 'present' ? 'Present' : 'Absent'}
                                                    </Badge>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={student.status === 'present' ? 'default' : 'outline'}
                                                        onClick={() => handleStatusChange(student.student, 'present')}
                                                        className={
                                                            student.status === 'present'
                                                                ? 'bg-green-500 hover:bg-green-600 text-white border-green-500 flex-1'
                                                                : 'border-green-500 text-green-600 hover:bg-green-50 flex-1'
                                                        }
                                                    >
                                                        👍 Present
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={student.status === 'absent' ? 'default' : 'outline'}
                                                        onClick={() => handleStatusChange(student.student, 'absent')}
                                                        className={
                                                            student.status === 'absent'
                                                                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500 flex-1'
                                                                : 'border-red-500 text-red-600 hover:bg-red-50 flex-1'
                                                        }
                                                    >
                                                        👎 Absent
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pagination */}
                            {filteredStudents.length > itemsPerPage && (
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{' '}
                                        {filteredStudents.length} results
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
                                            <>
                                                <span className="text-gray-400">...</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(totalPages)}
                                                >
                                                    {totalPages}
                                                </Button>
                                            </>
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
                        </>
                    )}
                </>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p className="text-gray-500">Please select a class to view attendance</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}