'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, Search, ChevronLeft, ChevronRight, Pencil, Trash, Plus, Loader2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { api, ApiException, formatApiError, logout } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

// Import data from JSON files
import classesData from '@/data/classes.json'

interface Student {
    id: number
    supervisor: number
    supervisor_name: string
    name: string
    email: string
    roll: string
    student_class: number
    student_class_name: string
}

interface ApiResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: Student[]
}

interface TeacherClass {
    id: number
    teacher: number
    name: string
    teacher_name: string
    created: string
}

interface TeacherClassListResponse {
    total_classes: number
    classes: TeacherClass[]
}


export default function StudentListClient() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [students, setStudents] = useState<Student[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [pageSize, setPageSize] = useState(10)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [authError, setAuthError] = useState(false)
    const [filterType, setFilterType] = useState('all')
    const [selectedClass, setSelectedClass] = useState('')
    const [classes, setClasses] = useState<TeacherClass[]>([])
    const [dateFrom, setDateFrom] = useState<Date>()
    const [dateTo, setDateTo] = useState<Date>()
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        roll: '',
        student_class: '',
    })

    // Fetch students from API
    const fetchStudents = async (page: number = 1, search: string = '') => {
        try {
            setLoading(true)
            setError(null)
            setAuthError(false)

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                page_size: pageSize.toString(),
            })

            if (search) {
                params.append('search', search)
            }

            if (filterType === 'by-class' && selectedClass) {
                params.append('student_class', selectedClass)
            }

            if (filterType === 'by-date') {
                if (dateFrom) {
                    params.append('date_from', format(dateFrom, 'yyyy-MM-dd'))
                }
                if (dateTo) {
                    params.append('date_to', format(dateTo, 'yyyy-MM-dd'))
                }
            }

            const response = await api.get<ApiResponse>(`/students/?${params.toString()}`)

            setStudents(response.results)
            setTotalPages(response.total_pages)
            setTotalCount(response.count)
            setCurrentPage(response.current_page)
            setPageSize(response.page_size)
        } catch (err) {
            const errorMessage = formatApiError(err)
            setError(errorMessage)

            // Check if it's an authentication error
            if (err instanceof ApiException && err.status === 401) {
                setAuthError(true)
            }

            console.error('Error fetching students:', err)
        } finally {
            setLoading(false)
        }
    }

    // Fetch classes from API
    const fetchClasses = async () => {
        try {
            setLoading(true)
            setError(null)
            setAuthError(false)

            const response = await api.get<TeacherClassListResponse>('/classes/summary/')
            setClasses(response.classes)
        } catch (err) {
            const errorMessage = formatApiError(err)
            setError(errorMessage)

            // Check if it's an authentication error
            if (err instanceof ApiException && err.status === 401) {
                setAuthError(true)
            }

            console.error('Error fetching classes:', err)
        } finally {
            setLoading(false)
        }
    }


    // Initial fetch
    useEffect(() => {
        fetchStudents(1, searchQuery)
        fetchClasses()
    }, [filterType, selectedClass, dateFrom, dateTo])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== undefined) {
                fetchStudents(1, searchQuery)
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        fetchStudents(page, searchQuery)
    }

    const openAddDialog = () => {
        setFormData({ name: '', email: '', roll: '', student_class: '' })
        setIsAddDialogOpen(true)
    }

    const openEditDialog = (student: Student) => {
        setSelectedStudent(student)
        setFormData({
            name: student.name,
            email: student.email,
            roll: student.roll,
            student_class: student.student_class.toString(),
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (student: Student) => {
        setSelectedStudent(student)
        setIsDeleteDialogOpen(true)
    }

    const handleAdd = async () => {
        if (formData.name && formData.email && formData.roll && formData.student_class) {
            try {
                setError(null)
                await api.post('/students/', {
                    name: formData.name,
                    email: formData.email,
                    roll: formData.roll,
                    student_class: parseInt(formData.student_class),
                })
                setIsAddDialogOpen(false)
                setFormData({ name: '', email: '', roll: '', student_class: '' })
                fetchStudents(currentPage, searchQuery)
            } catch (err) {
                const errorMessage = formatApiError(err)
                setError(`Failed to add student: ${errorMessage}`)

                // Don't close dialog on error so user can fix the issue
                console.error('Error adding student:', err)
            }
        }
    }

    const handleEdit = async () => {
        if (selectedStudent && formData.name && formData.email && formData.roll && formData.student_class) {
            try {
                setError(null)
                await api.put(`/students/${selectedStudent.id}/`, {
                    name: formData.name,
                    email: formData.email,
                    roll: formData.roll,
                    student_class: parseInt(formData.student_class),
                })
                setIsEditDialogOpen(false)
                setSelectedStudent(null)
                setFormData({ name: '', email: '', roll: '', student_class: '' })
                fetchStudents(currentPage, searchQuery)
            } catch (err) {
                const errorMessage = formatApiError(err)
                setError(`Failed to update student: ${errorMessage}`)

                // Don't close dialog on error so user can fix the issue
                console.error('Error updating student:', err)
            }
        }
    }

    const handleDelete = async () => {
        if (selectedStudent) {
            try {
                setError(null)
                await api.delete(`/students/${selectedStudent.id}/`)
                setIsDeleteDialogOpen(false)
                setSelectedStudent(null)
                fetchStudents(currentPage, searchQuery)
            } catch (err) {
                const errorMessage = formatApiError(err)
                setError(`Failed to delete student: ${errorMessage}`)

                // Close dialog even on error since delete action is destructive
                setIsDeleteDialogOpen(false)
                setSelectedStudent(null)
                console.error('Error deleting student:', err)
            }
        }
    }

    // Calculate pagination display
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalCount)

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p className="font-medium">Error</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-700 hover:text-red-900"
                        >
                            ×
                        </button>
                    </div>
                    {authError && (
                        <div className="mt-3">
                            <Button
                                size="sm"
                                onClick={() => {
                                    logout()
                                    router.push('/sign-in')
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Go to Login
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <div className='flex flex-row items-center gap-2.5 w-full'>
                {/* Search */}
                <div className="relative w-full py-3.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="search students or ID"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12"
                    />
                </div>

                {/* Add Button */}
                <Button
                    onClick={openAddDialog}
                    className="bg-[#00A4EF] h-12 cursor-pointer hover:bg-[#0090d1] text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Student
                </Button>
            </div>

            {/* Filter Section */}
            <div className="flex items-center gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[140px] border-none shadow-none">
                        <SelectValue placeholder="All Students" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="all">All Students</SelectItem>
                            <SelectItem value="by-date">By Date</SelectItem>
                            <SelectItem value="by-class">By Class</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>

                {/* Date Range Picker - Shows when "By Date" is selected */}
                {filterType === 'by-date' && (
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-[200px] justify-start text-left font-normal',
                                        !dateFrom && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateFrom ? format(dateFrom, 'PPP') : <span>From date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dateFrom}
                                    onSelect={setDateFrom}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <span className="text-gray-500">to</span>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-[200px] justify-start text-left font-normal',
                                        !dateTo && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTo ? format(dateTo, 'PPP') : <span>To date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dateTo}
                                    onSelect={setDateTo}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                )}

                {/* Class Dropdown - Shows when "By Class" is selected */}
                {filterType === 'by-class' && (
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            {/* Table */}
            <Card className='pt-0 overflow-hidden'>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No students found
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-gray-50">
                                        <tr>
                                            <th className="text-left p-4 font-medium text-gray-600">Name</th>
                                            <th className="text-left p-4 font-medium text-gray-600">ID/Roll</th>
                                            <th className="text-left p-4 font-medium text-gray-600">Email</th>
                                            <th className="text-left p-4 font-medium text-gray-600">Class / Grade</th>
                                            <th className="text-left p-4 font-medium text-gray-600">Supervisor</th>
                                            <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student) => (
                                            <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                <td className="p-4">{student.name}</td>
                                                <td className="p-4 text-gray-600">{student.roll}</td>
                                                <td className="p-4 text-gray-600">{student.email}</td>
                                                <td className="p-4 text-gray-600">{student.student_class_name}</td>
                                                <td className="p-4 text-gray-600">{student.supervisor_name}</td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => openEditDialog(student)}
                                                            variant="outline"
                                                            className='border-gray-800 cursor-pointer rounded-lg px-2.5 py-3.5'
                                                        >
                                                            <Pencil size={16} className="mr-1" />
                                                            <span>Edit</span>
                                                        </Button>

                                                        <Button
                                                            onClick={() => openDeleteDialog(student)}
                                                            variant="outline"
                                                            className='border-red-600 text-red-600 hover:text-red-600 cursor-pointer rounded-lg px-2.5 py-3.5'
                                                        >
                                                            <Trash size={16} className="mr-1" />
                                                            <span>Delete</span>
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
                                {students.map((student) => (
                                    <div key={student.id} className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{student.name}</p>
                                                <p className="text-sm text-gray-600">Roll: {student.roll}</p>
                                                <p className="text-sm text-gray-600">{student.email}</p>
                                                <p className="text-sm text-gray-600">Class: {student.student_class_name}</p>
                                                <p className="text-sm text-gray-600">Supervisor: {student.supervisor_name}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => openEditDialog(student)}
                                                size="sm"
                                                variant="outline"
                                                className="border-gray-800 flex-1"
                                            >
                                                <Pencil size={16} className="mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => openDeleteDialog(student)}
                                                size="sm"
                                                variant="outline"
                                                className="border-red-600 text-red-600 hover:text-red-600 flex-1"
                                            >
                                                <Trash size={16} className="mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {!loading && students.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {endIndex} of {totalCount} results
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handlePageChange(currentPage - 1)}
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
                                    size="icon-sm"
                                    onClick={() => handlePageChange(pageNum)}
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
                            <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => handlePageChange(totalPages)}
                            >
                                {totalPages}
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Add Student Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Student</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="studentName">Student Name</Label>
                            <Input
                                id="studentName"
                                placeholder="Enter student name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="studentEmail">Student Email</Label>
                            <Input
                                id="studentEmail"
                                type="email"
                                placeholder="Enter student email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="studentRoll">Student Roll / ID</Label>
                            <Input
                                id="studentRoll"
                                placeholder="Enter student roll"
                                value={formData.roll}
                                onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="studentClass">Class</Label>
                            <Select value={formData.student_class} onValueChange={(value) => setFormData({ ...formData, student_class: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} className="bg-[#00A4EF] hover:bg-[#0090d1]">
                            Add Student
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Student Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Student</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editStudentName">Student Name</Label>
                            <Input
                                id="editStudentName"
                                placeholder="Enter student name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editStudentEmail">Student Email</Label>
                            <Input
                                id="editStudentEmail"
                                type="email"
                                placeholder="Enter student email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editStudentRoll">Student Roll / ID</Label>
                            <Input
                                id="editStudentRoll"
                                placeholder="Enter student roll"
                                value={formData.roll}
                                onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editStudentClass">Class</Label>
                            <Select value={formData.student_class} onValueChange={(value) => setFormData({ ...formData, student_class: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classesData.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} className="bg-[#00A4EF] hover:bg-[#0090d1]">
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deleting</DialogTitle>
                        <DialogDescription className="pt-4">
                            Are you sure want to delete this student?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                        >
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}