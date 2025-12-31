'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api, formatApiError } from '@/lib/api-client'

interface ClassItem {
  id: number
  teacher: number
  name: string
  teacher_name: string
  created: string
  total_students: number
  total_weekly_schedules: number
}

interface ClassListResponse {
  total_pages: number
  current_page: number
  page_size: number
  count: number
  results: ClassItem[]
}


export default function ClassListClient() {

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(10)


  const [searchQuery, setSearchQuery] = useState('')


  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null)


  const [formData, setFormData] = useState({ name: '' })



  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString(),
      })

      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const res = await api.get<ClassListResponse>(
        `/classes/?${params.toString()}`
      )

      setClasses(res.results)
      setTotalPages(res.total_pages)
      setTotalCount(res.count)
      setPageSize(res.page_size)
    } catch (err) {
      setError(formatApiError(err))
    } finally {
      setLoading(false)
    }
  }



  useEffect(() => {
    const timer = setTimeout(fetchClasses, 400)
    return () => clearTimeout(timer)
  }, [currentPage, searchQuery])

 

  const handleAddClass = async () => {
    if (!formData.name.trim()) return

    try {
      await api.post('/classes/', { name: formData.name })
      setIsAddDialogOpen(false)
      setFormData({ name: '' })
      fetchClasses()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  const handleEditClass = async () => {
    if (!selectedClass || !formData.name.trim()) return

    try {
      await api.put(`/classes/${selectedClass.id}/`, {
        name: formData.name,
      })
      setIsEditDialogOpen(false)
      setSelectedClass(null)
      setFormData({ name: '' })
      fetchClasses()
    } catch (err) {
      setError(formatApiError(err))
    }
  }

  const handleDeleteClass = async () => {
    if (!selectedClass) return

    try {
      await api.delete(`/classes/${selectedClass.id}/`)
      setIsDeleteDialogOpen(false)
      setSelectedClass(null)
      fetchClasses()
    } catch (err) {
      setError(formatApiError(err))
    }
  }


  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalCount)

  const getPageNumbers = () => {
    const pages: number[] = []
    const maxVisible = 5

    let start = Math.max(1, currentPage - 2)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }


  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Search + Add */}
      <div className="flex gap-2.5">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search class name"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10 h-12"
          />
        </div>

        <Button
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-[#00A4EF] h-12 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No classes found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Students</th>
                    <th className="p-4 text-left">Schedules / Week</th>
                    <th className="p-4 text-left">Teacher</th>
                    <th className="p-4 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{cls.name}</td>
                      <td className="p-4">{cls.total_students}</td>
                      <td className="p-4">{cls.total_weekly_schedules}</td>
                      <td className="p-4">{cls.teacher_name}</td>
                      <td className="p-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedClass(cls)
                            setFormData({ name: cls.name })
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300"
                          onClick={() => {
                            setSelectedClass(cls)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && classes.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to {endIndex} of {totalCount}
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {getPageNumbers().map((page) => (
              <Button
                key={page}
                size="sm"
                variant={page === currentPage ? 'default' : 'outline'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Class Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ name: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClass}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClass}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Class</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this class?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button className="bg-red-500 text-white" onClick={handleDeleteClass}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
