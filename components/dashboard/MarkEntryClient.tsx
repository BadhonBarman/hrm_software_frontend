'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Upload, Download, Eye, Send, Pencil, X, PlusIcon, CheckCircle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import dynamic from 'next/dynamic'
import { api, formatApiError, downloadFile, uploadFile } from '@/lib/api-client'
import { AlertCircle, Loader2 } from 'lucide-react'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface ExamSubject {
    id: number
    exam: number
    subject: number
    subject_name: string
    total_mark: string
    pass_mark: string
    created: string
}

interface Result {
    id: number
    exam_subject: number
    student: number
    student_name: string
    student_roll: string
    subject_name: string
    obtained_mark: string
    is_marked: boolean
    is_passed: boolean
    created: string
}

interface Student {
    id: number
    supervisor: number
    supervisor_name: string
    name: string
    email: string
    roll: string
    student_class: number
    student_class_name: string
    results: Result[]
}

interface Class {
    id: number
    teacher: number
    name: string
    teacher_name: string
    created: string
    total_students: number
    total_weekly_schedules: number
}

interface Exam {
    id: number
    teacher: number
    name: string
    schedule: string
    exam_subjects: ExamSubject[]
    exam_class: {
        id: number
        name: string
    }
    created: string
}

interface MarkFormData {
    exam_subject_id: number
    subject_id: number // Actual subject ID for API
    subject_name: string
    total_mark: number
    pass_mark: number
    obtained_mark: number
}

const subjects = ['Bangla', 'English', 'History', 'Economics', 'Physics', 'Chemistry', 'Mathematics']

export default function MarkEntryClient() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClassId, setSelectedClassId] = useState('')
    const [selectedExamId, setSelectedExamId] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('')
    const [selectedGrade, setSelectedGrade] = useState('9 Grade')
    const [currentPage, setCurrentPage] = useState(1)
    
    // API State
    const [classes, setClasses] = useState<Class[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    const [students, setStudents] = useState<Student[]>([])
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
    const [examStatistics, setExamStatistics] = useState<{
        exam: string
        graph_data: Array<{ student: string; total_marks: number }>
    } | null>(null)
    const [loading, setLoading] = useState(false)
    const [loadingClasses, setLoadingClasses] = useState(false)
    const [loadingExams, setLoadingExams] = useState(false)
    const [loadingStudents, setLoadingStudents] = useState(false)
    const [loadingStatistics, setLoadingStatistics] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    
    // Dialog state
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [markFormData, setMarkFormData] = useState<MarkFormData[]>([])
    const [sendingResult, setSendingResult] = useState(false)
    
    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [uploadLoading, setUploadLoading] = useState(false)
    const [uploadResult, setUploadResult] = useState<{
        message: string
        success_count: number
        error_count: number
        errors: string[]
    } | null>(null)
    
    const itemsPerPage = 5

    // Fetch classes on component mount
    useEffect(() => {
        fetchClasses()
    }, [])

    // Fetch exams when class is selected
    useEffect(() => {
        if (selectedClassId) {
            fetchExams(selectedClassId)
            // Reset exam selection when class changes
            setSelectedExamId('')
            setStudents([])
            setSelectedExam(null)
        } else {
            setExams([])
            setSelectedExamId('')
            setStudents([])
            setSelectedExam(null)
        }
    }, [selectedClassId])

    // Fetch students when exam is selected
    useEffect(() => {
        if (selectedExamId) {
            fetchStudents(selectedExamId)
            fetchExamStatistics(selectedExamId)
        } else {
            setStudents([])
            setSelectedExam(null)
            setExamStatistics(null)
        }
    }, [selectedExamId])

    const fetchClasses = async () => {
        setLoadingClasses(true)
        setError(null)
        try {
            const response = await api.get<{ total_classes: number; classes: Class[] }>(
                '/classes/summary/'
            )
            setClasses(response.classes)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoadingClasses(false)
        }
    }

    const fetchExams = async (classId: string) => {
        setLoadingExams(true)
        setError(null)
        try {
            const response = await api.get<{
                total_pages: number
                current_page: number
                page_size: number
                count: number
                next: string | null
                previous: string | null
                results: Exam[]
            }>(`/exams?class_id=${classId}`)
            setExams(response.results)
        } catch (err) {
            setError(formatApiError(err))
            setExams([])
        } finally {
            setLoadingExams(false)
        }
    }

    const fetchStudents = async (examId: string) => {
        setLoadingStudents(true)
        setError(null)
        try {
            const response = await api.get<{
                exam: string
                total_students: number
                students: Student[]
            }>(`/exams/${examId}/get_students/`)
            
            setStudents(response.students)
            
            // Set selected exam details
            const exam = exams.find(e => e.id === parseInt(examId))
            setSelectedExam(exam || null)
        } catch (err) {
            setError(formatApiError(err))
            setStudents([])
        } finally {
            setLoadingStudents(false)
        }
    }

    const fetchExamStatistics = async (examId: string) => {
        setLoadingStatistics(true)
        setError(null)
        try {
            const response = await api.get<{
                exam: string
                graph_data: Array<{ student: string; total_marks: number }>
            }>(`/exams/${examId}/exam_statistics/`)
            
            setExamStatistics(response)
        } catch (err) {
            console.error('Failed to fetch exam statistics:', err)
            setExamStatistics(null)
        } finally {
            setLoadingStatistics(false)
        }
    }

    // Filter students based on search
    const filteredStudents = students.filter(
        (student) =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.roll.includes(searchQuery)
    )

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentStudents = filteredStudents.slice(startIndex, endIndex)

    // Get student status based on results
    const getStudentStatus = (student: Student): 'Marked' | 'Not Marked' => {
        if (!selectedExam || !selectedExam.exam_subjects) return 'Not Marked'
        
        const totalSubjects = selectedExam.exam_subjects.length
        const markedSubjects = student.results.filter(r => r.is_marked).length
        
        return markedSubjects === totalSubjects ? 'Marked' : 'Not Marked'
    }

    const closeEntryDialog = () => {
        setIsEntryDialogOpen(false)
        setSelectedStudent(null)
        setError(null) // Clear errors when closing
    }

    const openEntryDialog = (student: Student) => {
        setSelectedStudent(student)
        setError(null) // Clear any previous errors
        
        if (selectedExam && selectedExam.exam_subjects) {
            // Create mark form data from exam subjects
            const formData: MarkFormData[] = selectedExam.exam_subjects.map(examSubject => {
                // Find existing result for this subject
                const existingResult = student.results.find(
                    r => r.exam_subject === examSubject.id
                )
                
                return {
                    exam_subject_id: examSubject.id,
                    subject_id: examSubject.subject, // Store the actual subject ID
                    subject_name: examSubject.subject_name,
                    total_mark: parseFloat(examSubject.total_mark),
                    pass_mark: parseFloat(examSubject.pass_mark),
                    obtained_mark: existingResult ? parseFloat(existingResult.obtained_mark) : 0
                }
            })
            
            setMarkFormData(formData)
        }
        
        setIsEntryDialogOpen(true)
    }

    const openViewDialog = (student: Student) => {
        setSelectedStudent(student)
        setIsViewDialogOpen(true)
    }

    const openSendDialog = (student: Student) => {
        setSelectedStudent(student)
        setError(null)
        setIsSendDialogOpen(true)
    }

    const handleSendResult = async () => {
        if (!selectedStudent || !selectedExamId) return
        
        setSendingResult(true)
        setError(null)
        
        try {
            const payload = {
                student_id: selectedStudent.id.toString()
            }
            
            // Call the send_marksheet endpoint
            await api.post(`/exams/${selectedExamId}/send_marksheet/`, payload)
            
            // Close dialog
            setIsSendDialogOpen(false)
            setSelectedStudent(null)
            
            // Show success message
            setSuccessMessage(`Marksheet sent successfully to ${selectedStudent.name} (${selectedStudent.email})`)
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setSendingResult(false)
        }
    }

    const handleSaveMarks = async () => {
        if (!selectedStudent || !selectedExam || !selectedExamId) return
        
        // Validate marks before submitting
        const invalidMarks = markFormData.filter(mark => 
            mark.obtained_mark < 0 || mark.obtained_mark > mark.total_mark
        )
        
        if (invalidMarks.length > 0) {
            setError('Please ensure all marks are between 0 and the total marks for each subject.')
            return
        }
        
        setLoading(true)
        setError(null)
        
        try {
            // Prepare marks payload for the enter_marks endpoint
            const marks = markFormData.map(mark => ({
                student_id: selectedStudent.id,
                subject_id: mark.subject_id,
                obtained_mark: mark.obtained_mark
            }))
            
            const payload = { marks }
            
            // Call the enter_marks endpoint
            await api.post(`/exams/${selectedExamId}/enter_marks/`, payload)
            
            // Close dialog first
            closeEntryDialog()
            
            // Show success message
            setSuccessMessage(`Marks saved successfully for ${selectedStudent.name}`)
            
            // Refresh students list to show updated marks
            await fetchStudents(selectedExamId)
            
            // Refresh exam statistics
            await fetchExamStatistics(selectedExamId)
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const updateMark = (index: number, value: string) => {
        const newData = [...markFormData]
        const numValue = parseInt(value) || 0
        
        // Prevent marks greater than total marks
        if (numValue > newData[index].total_mark) {
            newData[index].obtained_mark = newData[index].total_mark
        } else if (numValue < 0) {
            newData[index].obtained_mark = 0
        } else {
            newData[index].obtained_mark = numValue
        }
        
        setMarkFormData(newData)
    }

    const getTotalMarks = () => {
        return markFormData.reduce((sum, subject) => sum + subject.total_mark, 0)
    }

    const getPassMarks = () => {
        return markFormData.reduce((sum, subject) => sum + subject.pass_mark, 0)
    }

    const getObtainMarks = () => {
        return markFormData.reduce((sum, subject) => sum + subject.obtained_mark, 0)
    }

    // Get display data for view dialog
    const getViewDialogData = () => {
        if (!selectedStudent || !selectedExam) return []
        
        return selectedExam.exam_subjects.map(examSubject => {
            const result = selectedStudent.results.find(r => r.exam_subject === examSubject.id)
            
            return {
                subject_name: examSubject.subject_name,
                total_mark: parseFloat(examSubject.total_mark),
                pass_mark: parseFloat(examSubject.pass_mark),
                obtained_mark: result ? parseFloat(result.obtained_mark) : 0,
                is_passed: result ? result.is_passed : false
            }
        })
    }

    // Performance Chart Options - Updated for exam statistics
    const performanceOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '60%',
                distributed: true, // Makes each bar a different color
            }
        },
        dataLabels: { 
            enabled: true,
            formatter: (val: number) => val.toFixed(0)
        },
        colors: ['#00A4EF', '#FFB900', '#F25022', '#7FBA00', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
        xaxis: {
            categories: examStatistics?.graph_data.map(item => item.student) || [],
            labels: {
                style: {
                    fontSize: '10px'
                },
                rotate: -45,
                rotateAlways: true
            }
        },
        yaxis: {
            title: {
                text: 'Total Marks'
            }
        },
        legend: {
            show: false
        },
        grid: {
            borderColor: '#f1f1f1',
        },
        tooltip: {
            y: {
                formatter: (val: number) => `${val.toFixed(2)} marks`
            }
        }
    }

    const performanceSeries = [
        { 
            name: 'Total Marks', 
            data: examStatistics?.graph_data.map(item => item.total_marks) || []
        }
    ]

   

const handleDownloadDataset = async () => {
    if (!selectedExamId) {
        setError('Please select an exam first')
        return
    }

    try {
        setLoading(true)
        setError(null)
        
        const filename = `marksheet_exam_${selectedExamId}_${new Date().toISOString().split('T')[0]}.xlsx`
        
        await downloadFile(
            `/exams/${selectedExamId}/download_marksheet_excel/`,
            filename
        )
        
        setSuccessMessage('Marksheet Excel file downloaded successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
        setError(formatApiError(err))
        console.error('Download error:', err)
    } finally {
        setLoading(false)
    }
}

const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        '.xlsx',
        '.xls'
    ]
    
    const isValidType = validTypes.some(type => 
        file.type === type || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    )
    
    if (!isValidType) {
        setError('Please upload a valid Excel file (.xlsx or .xls)')
        return
    }
    
    setSelectedFile(file)
    setUploadResult(null)
    setError(null)
}

const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
}

const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
}

const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
        handleFileSelect(files[0])
    }
}

const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
        handleFileSelect(files[0])
    }
}

const handleUploadExcel = async () => {
    if (!selectedFile || !selectedExamId) {
        setError('Please select a file and exam first')
        return
    }
    
    try {
        setUploadLoading(true)
        setError(null)
        setUploadResult(null)
        
        // Use the uploadFile helper from api-client
        const result = await uploadFile<{
            message: string
            success_count: number
            error_count: number
            errors: string[]
        }>(`/exams/${selectedExamId}/upload_marksheet_excel/`, selectedFile, 'file')
        
        setUploadResult(result)
        
        // Refresh students and statistics
        await fetchStudents(selectedExamId)
        await fetchExamStatistics(selectedExamId)
        
        // Clear file selection
        setSelectedFile(null)
        
        if (result.error_count === 0) {
            setSuccessMessage(`Upload successful! ${result.success_count} records processed.`)
            setTimeout(() => {
                setSuccessMessage(null)
                setIsUploadDialogOpen(false)
                setUploadResult(null)
            }, 3000)
        }
    } catch (err) {
        setError(formatApiError(err))
    } finally {
        setUploadLoading(false)
    }
}

const resetUploadDialog = () => {
    setSelectedFile(null)
    setUploadResult(null)
    setError(null)
    setIsDragging(false)
}



    return (
        <div className="space-y-6">
            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            
            {/* Success Alert */}
            {successMessage && (
                <Alert className="border-green-500 bg-green-50">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select 
                    value={selectedClassId} 
                    onValueChange={setSelectedClassId}
                    disabled={loadingClasses}
                >
                    <SelectTrigger className='w-full !h-12'>
                        <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select class"} />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select 
                    value={selectedExamId} 
                    onValueChange={setSelectedExamId}
                    disabled={!selectedClassId || loadingExams || exams.length === 0}
                >
                    <SelectTrigger className='w-full !h-12'>
                        <SelectValue placeholder={
                            !selectedClassId 
                                ? "Select class first" 
                                : loadingExams 
                                    ? "Loading exams..." 
                                    : exams.length === 0
                                        ? "No exams available"
                                        : "Select exam"
                        } />
                    </SelectTrigger>
                    <SelectContent>
                        {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id.toString()}>
                                {exam.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className='w-full !h-12'>
                        <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                                {subject}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select> */}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tracking">

                <div className='flex flex-row items-center gap-2.5 w-full'>
                    {/* Search */}
                    <div className="relative w-full py-3.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search student"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-12"
                        />
                    </div>

                    {/* Add Button */}
                    <Button
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="bg-[#00A4EF] hover:bg-[#0090d1] text-white h-12"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                    </Button>
                </div>

                <TabsList>
                    <TabsTrigger value="tracking">Tracking</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>

                <TabsContent value="tracking" className="mt-0">
                    {/* Warning message when no class/exam selected */}
                    {(!selectedClassId || !selectedExamId) && (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please select a class and exam first to view students and manage marks.
                            </AlertDescription>
                        </Alert>
                    )}

                    {loadingStudents ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-600">Loading students...</span>
                        </div>
                    ) : students.length === 0 && selectedClassId && selectedExamId ? (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                No students found for this exam.
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    {selectedClassId && selectedExamId && students.length > 0 && (
                        <>
                            <div className="flex justify-end mb-4">
                                <Button variant="outline" className="gap-2">
                                    <span className="text-sm">▼</span>
                                    All student
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
                                                    <th className="text-left p-4 font-medium text-gray-600">Student name</th>
                                                    <th className="text-left p-4 font-medium text-gray-600">ID/Roll</th>
                                                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                                                    <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentStudents.map((student) => {
                                                    const status = getStudentStatus(student)
                                                    return (
                                                        <tr key={student.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                                            <td className="p-4 font-medium">{student.name}</td>
                                                            <td className="p-4 text-gray-600">{student.roll}</td>
                                                            <td className="p-4">
                                                                <Badge
                                                                    variant={status === 'Marked' ? 'default' : 'secondary'}
                                                                    className={
                                                                        status === 'Marked'
                                                                            ? 'bg-green-500 hover:bg-green-600'
                                                                            : 'bg-yellow-500 hover:bg-yellow-600'
                                                                    }
                                                                >
                                                                    {status}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openEntryDialog(student)}
                                                                        className="border-gray-300 hover:bg-gray-50"
                                                                    >
                                                                        <Pencil className="w-4 h-4 mr-1" />
                                                                        Entry Mark
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openViewDialog(student)}
                                                                        className="border-gray-300 hover:bg-gray-50"
                                                                        disabled={status !== 'Marked'}
                                                                    >
                                                                        <Eye className="w-4 h-4 mr-1" />
                                                                        View result
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openSendDialog(student)}
                                                                        className="border-gray-300 hover:bg-gray-50"
                                                                        disabled={status !== 'Marked'}
                                                                    >
                                                                        <Send className="w-4 h-4 mr-1" />
                                                                        Send result
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile Cards */}
                                    <div className="md:hidden divide-y">
                                        {currentStudents.map((student) => {
                                            const status = getStudentStatus(student)
                                            return (
                                                <div key={student.id} className="p-4 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{student.name}</p>
                                                            <p className="text-sm text-gray-600">ID: {student.roll}</p>
                                                        </div>
                                                        <Badge
                                                            variant={status === 'Marked' ? 'default' : 'secondary'}
                                                            className={
                                                                status === 'Marked'
                                                                    ? 'bg-green-500 hover:bg-green-600'
                                                                    : 'bg-yellow-500 hover:bg-yellow-600'
                                                            }
                                                        >
                                                            {status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openEntryDialog(student)}
                                                            className="border-gray-300 hover:bg-gray-50 w-full"
                                                        >
                                                            <Pencil className="w-4 h-4 mr-1" />
                                                            Entry Mark
                                                        </Button>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openViewDialog(student)}
                                                                className="border-gray-300 hover:bg-gray-50"
                                                                disabled={status !== 'Marked'}
                                                            >
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openSendDialog(student)}
                                                                className="border-gray-300 hover:bg-gray-50"
                                                                disabled={status !== 'Marked'}
                                                            >
                                                                <Send className="w-4 h-4 mr-1" />
                                                                Send
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="performance" className="mt-0">
                    {/* Warning message when no class/exam selected */}
                    {(!selectedClassId || !selectedExamId) && (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please select a class and exam first to view exam statistics.
                            </AlertDescription>
                        </Alert>
                    )}

                    {loadingStatistics ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-600">Loading statistics...</span>
                        </div>
                    ) : !examStatistics || examStatistics.graph_data.length === 0 ? (
                        selectedClassId && selectedExamId && (
                            <Alert className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    No statistics available for this exam yet. Students need to be marked first.
                                </AlertDescription>
                            </Alert>
                        )
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold">{examStatistics.exam} - Student Performance</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Total students: {examStatistics.graph_data.length}
                                    </p>
                                </div>
                                <Chart
                                    options={performanceOptions}
                                    series={performanceSeries}
                                    type="bar"
                                    height={350}
                                />
                                
                                {/* Statistics Summary */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Highest Score</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {Math.max(...examStatistics.graph_data.map(d => d.total_marks)).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-yellow-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Average Score</p>
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {(examStatistics.graph_data.reduce((sum, d) => sum + d.total_marks, 0) / examStatistics.graph_data.length).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600">Lowest Score</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {Math.min(...examStatistics.graph_data.map(d => d.total_marks)).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Pagination */}
            {selectedClassId && selectedExamId && filteredStudents.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredStudents.length)} of{' '}
                        {filteredStudents.length} results
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
                            <Button variant="outline" size="icon-sm" onClick={() => setCurrentPage(totalPages)}>
                                {totalPages}
                            </Button>
                        )}
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
            )}

            {/* Upload CSV Dialog */}
            <Dialog open={isUploadDialogOpen} onOpenChange={(open) => {
                setIsUploadDialogOpen(open)
                if (!open) resetUploadDialog()
            }}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Upload Marksheet Excel</DialogTitle>
                        <DialogDescription>
                            Download the template, fill in the marks, and upload the completed file
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Error display in dialog */}
                    {error && (
                        <Alert variant="destructive" className="my-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="space-y-4 py-4">
                        {/* Download Template Button */}
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={handleDownloadDataset}
                            disabled={!selectedExamId || loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Student Dataset Template
                                </>
                            )}
                        </Button>
                        
                        {/* Drag and Drop Zone */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                isDragging 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : selectedFile 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-gray-300 bg-gray-50'
                            }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <input
                                type="file"
                                id="excel-upload"
                                accept=".xlsx,.xls"
                                onChange={handleFileInputChange}
                                className="hidden"
                            />
                            
                            {selectedFile ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-green-900">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {(selectedFile.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFile(null)
                                            setUploadResult(null)
                                        }}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Remove File
                                    </Button>
                                </div>
                            ) : (
                                <label htmlFor="excel-upload" className="cursor-pointer">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Upload className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-base font-medium text-gray-900">
                                                Drop your Excel file here or click to browse
                                            </p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Supports .xlsx and .xls files
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            )}
                        </div>
                        
                        {/* Upload Result */}
                        {uploadResult && (
                            <Alert className={uploadResult.error_count === 0 ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}>
                                <AlertCircle className={`h-4 w-4 ${uploadResult.error_count === 0 ? 'text-green-600' : 'text-yellow-600'}`} />
                                <AlertDescription className={uploadResult.error_count === 0 ? 'text-green-800' : 'text-yellow-800'}>
                                    <div className="space-y-2">
                                        <p className="font-semibold">{uploadResult.message}</p>
                                        <div className="flex gap-4 text-sm">
                                            <span>✓ Success: {uploadResult.success_count}</span>
                                            {uploadResult.error_count > 0 && (
                                                <span>✗ Errors: {uploadResult.error_count}</span>
                                            )}
                                        </div>
                                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                                            <div className="mt-2">
                                                <p className="font-medium text-sm mb-1">Errors:</p>
                                                <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                                                    {uploadResult.errors.map((err, idx) => (
                                                        <li key={idx} className="text-red-700">• {err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                    
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsUploadDialogOpen(false)
                                resetUploadDialog()
                            }}
                            disabled={uploadLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="bg-[#00A4EF] hover:bg-[#0090d1]"
                            onClick={handleUploadExcel}
                            disabled={!selectedFile || uploadLoading}
                        >
                            {uploadLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload & Process
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Entry Mark Dialog */}
            <Dialog open={isEntryDialogOpen} onOpenChange={(open) => !open && closeEntryDialog()}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <DialogTitle>{selectedStudent?.name}</DialogTitle>
                            {/* <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={closeEntryDialog}
                            >
                                <X className="w-4 h-4" />
                            </Button> */}
                        </div>
                        <p className="text-sm text-gray-600">Roll: {selectedStudent?.roll}</p>
                    </DialogHeader>
                    
                    {/* Error display in dialog */}
                    {error && (
                        <Alert variant="destructive" className="my-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="py-4">
                        <table className="w-full">
                            <thead className="border-b">
                                <tr>
                                    <th className="text-left p-2 text-sm font-medium">Name</th>
                                    <th className="text-center p-2 text-sm font-medium">Total Marks</th>
                                    <th className="text-center p-2 text-sm font-medium">Pass Marks</th>
                                    <th className="text-center p-2 text-sm font-medium">Obtain mark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {markFormData.map((subject, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2 text-sm">{subject.subject_name}</td>
                                        <td className="p-2 text-center">
                                            <Input
                                                type="number"
                                                value={subject.total_mark}
                                                disabled
                                                className="w-16 text-center mx-auto"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Input
                                                type="number"
                                                value={subject.pass_mark}
                                                disabled
                                                className="w-16 text-center mx-auto"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <Input
                                                type="number"
                                                value={subject.obtained_mark}
                                                onChange={(e) => updateMark(index, e.target.value)}
                                                className="w-16 text-center mx-auto"
                                                max={subject.total_mark}
                                                min={0}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeEntryDialog}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveMarks} 
                            className="bg-[#00A4EF] hover:bg-[#0090d1]"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Result Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <DialogTitle>{selectedStudent?.name}</DialogTitle>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setIsViewDialogOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-sm text-gray-600">Roll: {selectedStudent?.roll}</p>
                    </DialogHeader>
                    <div className="py-4">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="text-left p-2 text-sm font-medium">Name</th>
                                    <th className="text-center p-2 text-sm font-medium">Total Marks</th>
                                    <th className="text-center p-2 text-sm font-medium">Pass mark</th>
                                    <th className="text-center p-2 text-sm font-medium">Obtain mark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {getViewDialogData().map((subject, index) => (
                                    <tr key={index} className="border-b">
                                        <td className="p-2 text-sm">{subject.subject_name}</td>
                                        <td className="p-2 text-center text-sm">{subject.total_mark}</td>
                                        <td className="p-2 text-center text-sm">{subject.pass_mark}</td>
                                        <td className={`p-2 text-center text-sm font-medium ${
                                            subject.obtained_mark < subject.pass_mark ? 'text-red-500' : 'text-blue-500'
                                        }`}>
                                            {subject.obtained_mark}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="border-t-2 font-semibold">
                                    <td className="p-2 text-sm">Total</td>
                                    <td className="p-2 text-center text-sm">
                                        {getViewDialogData().reduce((sum, s) => sum + s.total_mark, 0)}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                        {getViewDialogData().reduce((sum, s) => sum + s.pass_mark, 0)}
                                    </td>
                                    <td className="p-2 text-center text-sm">
                                        {getViewDialogData().reduce((sum, s) => sum + s.obtained_mark, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Send Result Dialog */}
            <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Marksheet</DialogTitle>
                        <DialogDescription>
                            Review the results before sending to the student
                        </DialogDescription>
                    </DialogHeader>
                    
                    {/* Student Info */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Student Name:</span>
                            <span className="text-sm font-medium">{selectedStudent?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Roll Number:</span>
                            <span className="text-sm font-medium">{selectedStudent?.roll}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Email:</span>
                            <span className="text-sm font-medium">{selectedStudent?.email}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Class:</span>
                            <span className="text-sm font-medium">{selectedStudent?.student_class_name}</span>
                        </div>
                    </div>

                    {/* Results Summary */}
                    <div className="py-2">
                        <h4 className="text-sm font-semibold mb-3">Results Summary</h4>
                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left p-2 font-medium">Subject</th>
                                        <th className="text-center p-2 font-medium">Marks</th>
                                        <th className="text-center p-2 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getViewDialogData().map((subject, index) => (
                                        <tr key={index} className="border-t">
                                            <td className="p-2">{subject.subject_name}</td>
                                            <td className="text-center p-2">
                                                {subject.obtained_mark}/{subject.total_mark}
                                            </td>
                                            <td className="text-center p-2">
                                                {subject.obtained_mark >= subject.pass_mark ? (
                                                    <Badge className="bg-green-500 hover:bg-green-600">Pass</Badge>
                                                ) : (
                                                    <Badge className="bg-red-500 hover:bg-red-600">Fail</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-2 font-semibold bg-gray-50">
                                        <td className="p-2">Total</td>
                                        <td className="text-center p-2">
                                            {getViewDialogData().reduce((sum, s) => sum + s.obtained_mark, 0)}/
                                            {getViewDialogData().reduce((sum, s) => sum + s.total_mark, 0)}
                                        </td>
                                        <td className="text-center p-2">
                                            {getViewDialogData().every(s => s.obtained_mark >= s.pass_mark) ? (
                                                <Badge className="bg-green-500 hover:bg-green-600">Pass</Badge>
                                            ) : (
                                                <Badge className="bg-red-500 hover:bg-red-600">Fail</Badge>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Error display in dialog */}
                    {error && (
                        <Alert variant="destructive" className="my-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setIsSendDialogOpen(false)
                                setSelectedStudent(null)
                                setError(null)
                            }}
                            disabled={sendingResult}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSendResult} 
                            className="bg-[#00A4EF] hover:bg-[#0090d1]"
                            disabled={sendingResult}
                        >
                            {sendingResult ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Confirm & Send
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}