'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Plus, Trash2, Loader2, AlertCircle, MoreVertical, Eye, Edit, ArrowLeft } from 'lucide-react'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api, formatApiError } from '@/lib/api-client'

interface LessonNote {
    id: number
    lesson: number
    name: string
    note: string
    lesson_home_work: any[]
    created: string
    updated: string
}

interface NotesResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: LessonNote[]
}

export default function LessonNotesClient() {
    const router = useRouter()
    const params = useParams()
    const lessonId = params?.id as string
    
    const [searchQuery, setSearchQuery] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [notes, setNotes] = useState<LessonNote[]>([])
    const [totalPages, setTotalPages] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    
    // Dialog states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    
    // Selected note
    const [selectedNote, setSelectedNote] = useState<LessonNote | null>(null)
    
    // Form data
    const [formData, setFormData] = useState({
        name: '',
        note: '',
    })
    
    // Loading and error states
    const [loading, setLoading] = useState(false)
    const [loadingNotes, setLoadingNotes] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    
    const itemsPerPage = 10

    // Fetch notes
    useEffect(() => {
        if (lessonId) {
            fetchNotes()
        }
    }, [lessonId, currentPage])

    const fetchNotes = async () => {
        setLoadingNotes(true)
        setError(null)
        try {
            const response = await api.get<NotesResponse>(
                `/lesson-notes/by_lesson/?lesson_id=${lessonId}&page=${currentPage}`
            )
            setNotes(response.results)
            setTotalPages(response.total_pages)
            setTotalCount(response.count)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoadingNotes(false)
        }
    }

    // Filter based on search
    const filteredItems = notes.filter(
        (item) =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.note.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleAdd = async () => {
        if (!formData.name || !formData.note) {
            setError('Please fill in all required fields')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await api.post('/lesson-notes/', {
                lesson: parseInt(lessonId),
                name: formData.name,
                note: formData.note,
            })

            setSuccessMessage('Note created successfully')
            await fetchNotes()
            setIsAddDialogOpen(false)
            setFormData({ name: '', note: '' })
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = async () => {
        if (!selectedNote || !formData.name || !formData.note) {
            setError('Please fill in all required fields')
            return
        }

        setLoading(true)
        setError(null)
        try {
            await api.put(`/lesson-notes/${selectedNote.id}/`, {
                lesson: parseInt(lessonId),
                name: formData.name,
                note: formData.note,
            })

            setSuccessMessage('Note updated successfully')
            await fetchNotes()
            setIsEditDialogOpen(false)
            setSelectedNote(null)
            setFormData({ name: '', note: '' })
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedNote) return

        setLoading(true)
        setError(null)
        try {
            await api.delete(`/lesson-notes/${selectedNote.id}/`)
            
            setSuccessMessage('Note deleted successfully')
            await fetchNotes()
            setIsDeleteDialogOpen(false)
            setSelectedNote(null)
            setTimeout(() => setSuccessMessage(null), 3000)
        } catch (err) {
            setError(formatApiError(err))
        } finally {
            setLoading(false)
        }
    }

    const openEditDialog = (note: LessonNote) => {
        setSelectedNote(note)
        setFormData({
            name: note.name,
            note: note.note,
        })
        setError(null)
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (note: LessonNote) => {
        setSelectedNote(note)
        setError(null)
        setIsDeleteDialogOpen(true)
    }

    const openViewDialog = (note: LessonNote) => {
        setSelectedNote(note)
        setIsViewDialogOpen(true)
    }

    const openAddDialog = () => {
        setFormData({ name: '', note: '' })
        setError(null)
        setIsAddDialogOpen(true)
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
            <div className="flex flex-col gap-4">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard/lesson-planning')}
                    className="w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Lesson Plans
                </Button>

                <div className='flex flex-row items-center gap-2.5 w-full'>
                    {/* Search */}
                    <div className="relative w-full py-3.5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search Notes"
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
                        Add Note
                    </Button>
                </div>
            </div>

            {/* Content */}
            {loadingNotes ? (
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600">Loading notes...</span>
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
                                        <th className="text-left p-4 font-medium text-gray-600">Note</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Created</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Updated</th>
                                        <th className="text-left p-4 font-medium text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((note) => (
                                        <tr key={note.id} className="border-b last:border-b-0 hover:bg-gray-50">
                                            <td className="p-4 font-medium">{note.name}</td>
                                            <td className="p-4 text-gray-600 max-w-md truncate">{note.note}</td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(note.created).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                {new Date(note.updated).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
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
                                                        <DropdownMenuItem onClick={() => openViewDialog(note)}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            <span>View</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openEditDialog(note)}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            <span>Edit</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600"
                                                            onClick={() => openDeleteDialog(note)}
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
                            {filteredItems.map((note) => (
                                <div key={note.id} className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium">{note.name}</p>
                                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{note.note}</p>
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
                                                <DropdownMenuItem onClick={() => openViewDialog(note)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEditDialog(note)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => openDeleteDialog(note)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div>Created: {new Date(note.created).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</div>
                                        <div>Updated: {new Date(note.updated).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredItems.length === 0 && !loadingNotes && (
                            <div className="text-center py-12 text-gray-500">
                                <p>No notes found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Pagination */}
            {filteredItems.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing {filteredItems.length} of {totalCount} results
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

            {/* Add Note Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Note</DialogTitle>
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
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="noteContent">Note Content</Label>
                            <Textarea
                                id="noteContent"
                                placeholder="Enter note content"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                rows={6}
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
                                'Add Note'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Note Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Note</DialogTitle>
                    </DialogHeader>
                    {error && (
                        <Alert variant="destructive" className="mb-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="editNoteTitle">Note Title</Label>
                            <Input
                                id="editNoteTitle"
                                placeholder="Enter note title"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editNoteContent">Note Content</Label>
                            <Textarea
                                id="editNoteContent"
                                placeholder="Enter note content"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                rows={6}
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

            {/* View Note Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedNote?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm text-gray-600">Note Content</Label>
                            <div className="p-4 bg-gray-50 rounded-md border min-h-[200px] whitespace-pre-wrap">
                                {selectedNote?.note}
                            </div>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                            <div>
                                <span className="font-medium">Created:</span>{' '}
                                {selectedNote && new Date(selectedNote.created).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            <div>
                                <span className="font-medium">Updated:</span>{' '}
                                {selectedNote && new Date(selectedNote.updated).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                        <Button 
                            onClick={() => {
                                setIsViewDialogOpen(false)
                                openEditDialog(selectedNote!)
                            }}
                            className="bg-[#00A4EF] hover:bg-[#0090d1]"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Note
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Note</DialogTitle>
                        <DialogDescription className="pt-4">
                            Are you sure you want to delete "{selectedNote?.name}"? This action cannot be undone.
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
        </div>
    )
}