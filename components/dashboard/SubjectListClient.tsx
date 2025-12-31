'use client'

import React, { useEffect, useState } from 'react'
import { api, ApiException, formatApiError } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, PencilIcon, TrashIcon, PlusIcon } from 'lucide-react'
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
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface SubjectClass {
    id: number
    name: string
}

interface Subject {
    id: number
    name: string
    code: string
    subject_class: SubjectClass
}

interface ApiResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: Subject[]
}

interface ClassSummary {
    id: number
    name: string
}

export default function SubjectListClient() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [classes, setClasses] = useState<ClassSummary[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        grade: '', // will hold class id as string
    })

    // Fetch subjects
    const fetchSubjects = async (page = 1) => {
        setLoading(true)
        setError(null)
        try {
            const data = await api.get<ApiResponse>(`/subjects/?page=${page}`)
            setSubjects(data.results)
            setCurrentPage(data.current_page)
            setTotalPages(data.total_pages)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    // Fetch classes for dropdown
    const fetchClasses = async () => {
        try {
            const data = await api.get<{ total_classes: number; classes: ClassSummary[] }>('/classes/summary/')
            setClasses(data.classes)
        } catch (err) {
            console.error(formatApiError(err))
        }
    }

    useEffect(() => {
        fetchSubjects(currentPage)
        fetchClasses()
    }, [currentPage])

    const openAddDialog = () => {
        setFormData({ name: '', code: '', grade: '' })
        setIsAddDialogOpen(true)
    }

    const openEditDialog = (subject: Subject) => {
        setSelectedSubject(subject)
        setFormData({
            name: subject.name,
            code: subject.code,
            grade: subject.subject_class.id.toString(),
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (subject: Subject) => {
        setSelectedSubject(subject)
        setIsDeleteDialogOpen(true)
    }

    const handleAddSubject = async () => {
        try {
            await api.post('/subjects/', {
                name: formData.name,
                code: formData.code,
                subject_class: parseInt(formData.grade),
            })
            setIsAddDialogOpen(false)
            fetchSubjects(currentPage)
        } catch (err) {
            alert(formatApiError(err))
        }
    }

    const handleEditSubject = async () => {
        if (!selectedSubject) return
        try {
            await api.put(`/subjects/${selectedSubject.id}/`, {
                name: formData.name,
                code: formData.code,
                subject_class: parseInt(formData.grade),
            })
            setIsEditDialogOpen(false)
            fetchSubjects(currentPage)
        } catch (err) {
            alert(formatApiError(err))
        }
    }

    const handleDeleteSubject = async () => {
        if (!selectedSubject) return
        try {
            await api.delete(`/subjects/${selectedSubject.id}/`)
            setIsDeleteDialogOpen(false)
            fetchSubjects(currentPage)
        } catch (err) {
            alert(formatApiError(err))
        }
    }

    const filteredSubjects = subjects.filter(
        (subject) =>
            subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.code.includes(searchQuery) ||
            subject.subject_class.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Search & Add */}
            <div className='flex flex-row items-center gap-2.5 w-full'>
                <div className="relative w-full py-3.5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search Subject, Code or Class"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12"
                    />
                </div>
                <Button onClick={openAddDialog} className="bg-[#00A4EF] h-12 hover:bg-[#0090d1] text-white">
                    <PlusIcon className="w-4 h-4 mr-2" /> Add Subject
                </Button>
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-600">Subject Name</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Code</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Class</th>
                                    <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubjects.map((subject) => (
                                    <tr key={subject.id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">{subject.name}</td>
                                        <td className="p-4 text-gray-600">{subject.code}</td>
                                        <td className="p-4 text-gray-600">{subject.subject_class.name}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => openEditDialog(subject)}
                                                    variant="outline"
                                                    className='border-gray-800 px-2.5 py-3.5 rounded-lg'
                                                >
                                                    <PencilIcon size={16} className="mr-1" /> Edit
                                                </Button>
                                                <Button
                                                    onClick={() => openDeleteDialog(subject)}
                                                    variant="outline"
                                                    className='border-red-600 text-red-600 px-2.5 py-3.5 rounded-lg'
                                                >
                                                    <TrashIcon size={16} className="mr-1" /> Delete
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSubjects.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-500">
                                            {loading ? 'Loading...' : 'No subjects found'}
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

            {/* Add Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject Code</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
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
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-[#00A4EF] hover:bg-[#0090d1]" onClick={handleAddSubject}>Add Subject</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Subject</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Subject Name</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject Code</Label>
                            <Input
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
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
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-[#00A4EF] hover:bg-[#0090d1]" onClick={handleEditSubject}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Deleting Subject</DialogTitle>
                        <DialogDescription className="pt-4">
                            Are you sure you want to delete this subject?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                        <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleDeleteSubject}>
                            <TrashIcon className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
