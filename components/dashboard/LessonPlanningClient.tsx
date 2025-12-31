'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from "next/navigation";
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2, AlertCircle, MoreVertical, FileText, Edit, SquareArrowOutUpRight, SquareArrowOutUpRightIcon } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api, formatApiError } from '@/lib/api-client'

interface LessonPlanNote {
    id: number
    lesson: number
    name: string
    note: string
    created: string
    updated: string
}

interface LessonPlan {
    id: number
    teacher: number
    subject: number
    description: string
    subject_name: string
    lesson_class: string
    name: string
    is_completed: boolean
    lesson_plan_note: LessonPlanNote[]
    created: string
    updated: string
}

interface Subject {
    id: number
    teacher: {
        user: number
        name: string
        institute: string
        country: number
        country_name: string
        designation: string
        subject: string
        status: boolean
        subscription_status: string
        user_email: string
        created: string
        updated: string
    }
    name: string
    subject_class: {
        id: number
        teacher: number
        name: string
        teacher_name: string
        created: string
        total_students: number
        total_weekly_schedules: number
    }
    code: string
    created: string
}

export default function LessonPlanningClient() {
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    
    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
    
    // Selected items
    const [selectedLesson, setSelectedLesson] = useState<LessonPlan | null>(null)
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        subject_id: '',
        description: '',
    })
    
    const [noteFormData, setNoteFormData] = useState({
        name: '',
        note: '',
    })
    
    // Loading and error states
    const [loading, setLoading] = useState(false)
    const [loadingLessons, setLoadingLessons] = useState(false)
    const [loadingSubjects, setLoadingSubjects] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    
    const itemsPerPage = 5
    const router = useRouter();

    // Fetch initial data
    useEffect(() => {
        fetchLessonPlans()
        fetchSubjects()
    }, [])

    const fetchLessonPlans = async () => {
        setLoadingLessons(true)
        setError(null)
        try {
            const response = await api.get<LessonPlan[]>('/lesson-planning/')
            setLessonPlans(response)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoadingLessons(false)
        }
    }

    const fetchSubjects = async () => {
        setLoadingSubjects(true)
        try {
            const response = await api.get<{ total_subject: number; subjects: Subject[] }>('/subjects/summary/')
            setSubjects(response.subjects)
        } catch (err) {
            console.error('Failed to fetch subjects:', err)
        } finally {
            setLoadingSubjects(false)
        }
    }

    // Filter based on search
    const filteredItems = lessonPlans.filter(
        (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentItems = filteredItems.slice(startIndex, endIndex)

    const handleAdd = async () => {
        if (!formData.name || !formData.description || !formData.subject_id) {
            setError('Please fill in all required fields')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await api.post('/lesson-planning/', {
                subject: parseInt(formData.subject_id),
                name: formData.name,
                description: formData.description,
            })

            setSuccessMessage('Lesson plan created successfully')
            await fetchLessonPlans()
            setIsAddDialogOpen(false)
            setFormData({ 
                name: '', 
                subject_id: '', 
                description: '',
            })
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedLesson || !formData.name || !formData.description || !formData.subject_id) {
            setError('Please fill in all required fields')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await api.put(`/lesson-planning/${selectedLesson.id}/`, {
                subject: parseInt(formData.subject_id),
                name: formData.name,
                description: formData.description,
            })

            setSuccessMessage('Lesson plan updated successfully')
            await fetchLessonPlans()
            setIsEditDialogOpen(false)
            setSelectedLesson(null)
            setFormData({ 
                name: '', 
                subject_id: '', 
                description: '',
            })
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedLesson) return

        setLoading(true)
        setError(null)
        try {
            await api.delete(`/lesson-planning/${selectedLesson.id}/`)
            
            setSuccessMessage('Lesson plan deleted successfully')
            await fetchLessonPlans()
            setIsDeleteDialogOpen(false)
            setSelectedLesson(null)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleAddNote = async () => {
        if (!selectedLesson || !noteFormData.name || !noteFormData.note) {
            setError('Please fill in all required fields')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await api.post('/lesson-notes/', {
                lesson: selectedLesson.id,
                name: noteFormData.name,
                note: noteFormData.note,
            })

            setSuccessMessage('Note added successfully')
            await fetchLessonPlans()
            setIsNoteDialogOpen(false)
            setNoteFormData({ name: '', note: '' })
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const openEditDialog = (lesson: LessonPlan) => {
        setSelectedLesson(lesson)
        
        setFormData({
            name: lesson.name,
            subject_id: lesson.subject.toString(),
            description: lesson.description,
        })
        setError(null)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (lesson: LessonPlan) => {
        setSelectedLesson(lesson)
        setError(null)
        setIsDeleteDialogOpen(true)
    }

    const openAddDialog = () => {
        setFormData({ 
            name: '', 
            subject_id: '', 
            description: '',
        })
        setError(null)
        setIsAddDialogOpen(true)
    }

    const openNoteDialog = (lesson: LessonPlan) => {
        setSelectedLesson(lesson)
        setNoteFormData({ name: '', note: '' })
        setError(null)
        setIsNoteDialogOpen(true)
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

            {/* Header */}
            <div className='flex flex-row items-center gap-2.5 w-full'>
                {/* Search */}
                <div className="relative w-full py-3.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search Lesson"
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
                    Add Lesson
                </Button>
            </div>

            {/* Content */}
            {loadingLessons ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading lesson plans...</span>
                </div>
            ) : (
                <Card>
                    <CardContent className="p-0">
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="border-b bg-gray-50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-gray-600">Title</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Description</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Subject</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Class</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Date</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Notes</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((lesson) => (
                                        <tr key={lesson.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                            <td className="p-4 font-medium">{lesson.name}</td>
                                            <td className="p-4 text-gray-600 max-w-xs truncate">{lesson.description}</td>
                                            <td className="p-4 text-gray-600">{lesson.subject_name}</td>
                                            <td className="p-4 text-gray-600">{lesson.lesson_class}</td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(lesson.created).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600">
                                                    {lesson.lesson_plan_note.length} note{lesson.lesson_plan_note.length !== 1 ? 's' : ''}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openNoteDialog(lesson)}>
                                                            <FileText className="mr-2 h-4 w-4" />
                                                            <span>Add Note</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/lesson-planning/notes/${lesson.id}`)}>
                                                            <SquareArrowOutUpRightIcon className="w-4 h-4 mr-2" />
                                                            Insides
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => openDeleteDialog(lesson)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            <span>Delete</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y">
                            {currentItems.map((lesson) => (
                                <div key={lesson.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium">{lesson.name}</p>
                                            <p className="text-sm text-gray-600 mt-1">{lesson.description}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openNoteDialog(lesson)}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    Add Note
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(lesson)}>
                                                    <SquareArrowOutUpRightIcon className="w-4 h-4 mr-2" />
                                                    
                                                    Insides
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => openDeleteDialog(lesson)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div>Subject: {lesson.subject_name}</div>
                                        <div>Class: {lesson.lesson_class}</div>
                                        <div>Created: {new Date(lesson.created).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</div>
                                        <div>Notes: {lesson.lesson_plan_note.length}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {filteredItems.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredItems.length)} of{' '}
                        {filteredItems.length} results
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

            {/* Add Lesson Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Lesson Plan</DialogTitle>
                    </DialogHeader>
                    {error && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Select Subject</Label>
                            <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id.toString()}>
                                            {subject.name} ({subject.subject_class.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Lesson Title</Label>
                            <Input
                                id="title"
                                placeholder="Enter lesson title"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Enter lesson description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAdd} className="bg-[#00A4EF] hover:bg-[#0090d1]" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Lesson Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Lesson Plan</DialogTitle>
                    </DialogHeader>
                    {error && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editSubject">Select Subject</Label>
                            <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id.toString()}>
                                            {subject.name} ({subject.subject_class.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editTitle">Lesson Title</Label>
                            <Input
                                id="editTitle"
                                placeholder="Enter lesson title"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editDescription">Description</Label>
                            <Textarea
                                id="editDescription"
                                placeholder="Enter lesson description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEdit} className="bg-[#00A4EF] hover:bg-[#0090d1]" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deleting Lesson Plan</DialogTitle>
                        <DialogDescription className="pt-4">
                            Are you sure you want to delete this lesson plan? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Note Dialog */}
            <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Note to {selectedLesson?.name}</DialogTitle>
                    </DialogHeader>
                    {error && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="noteTitle">Note Title</Label>
                            <Input
                                id="noteTitle"
                                placeholder="Enter note title"
                                value={noteFormData.name}
                                onChange={(e) => setNoteFormData({ ...noteFormData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="noteContent">Note Content</Label>
                            <Textarea
                                id="noteContent"
                                placeholder="Enter note content"
                                value={noteFormData.note}
                                onChange={(e) => setNoteFormData({ ...noteFormData, note: e.target.value })}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddNote} className="bg-[#00A4EF] hover:bg-[#0090d1]" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                'Add Note'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}