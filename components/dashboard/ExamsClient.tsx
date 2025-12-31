'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Download, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, formatApiError } from '@/lib/api-client'

interface ExamSubject {
  subject_id: number
  total_mark: number
  pass_mark: number
}

interface TeacherSubject {
  id: number
  name: string
  code: string
  subject_class: {
    id: number
    name: string
  }
}

interface Exam {
  id: number
  name: string
  schedule: string
  exam_subjects: {
    id?: number
    exam: number
    subject: number
    subject_name: string
    total_mark: string | number
    pass_mark: string | number
  }[]
}

interface StudentResult {
  id: string
  studentName: string
  idRoll: string
  status: string
  subjects: {
    name: string
    totalMarks: number
    passMarks: number
    obtainMarks: number
  }[]
}

interface ApiResponse {
  total_pages: number
  current_page: number
  page_size: number
  count: number
  next: string | null
  previous: string | null
  results: Exam[]
}

export default function ExamsClient() {
  const [currentTab, setCurrentTab] = useState<'exam' | 'results'>('exam')
  const [exams, setExams] = useState<Exam[]>([])
  const [subjects, setSubjects] = useState<TeacherSubject[]>([])
  const [studentsResults, setStudentsResults] = useState<StudentResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null)

  const [subjectSearch, setSubjectSearch] = useState('')
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false)
  const subjectDropdownRef = useRef<HTMLDivElement | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    schedule: '',
    selectedSubjects: [] as ExamSubject[],
  })

  const itemsPerPage = 5

  /** ---------------- Fetch Data ---------------- **/

  const fetchExams = async (page = 1) => {
    setLoading(true)
    try {
      const data = await api.get<ApiResponse>(`/exams/?page=${page}`)
      setExams(data.results)
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
      const data = await api.get<{ total_subject: number; subjects: TeacherSubject[] }>('/subjects/summary/')
      setSubjects(data.subjects)
    } catch (err) {
      console.error(formatApiError(err))
    }
  }

  useEffect(() => {
    fetchExams(currentPage)
    fetchSubjects()
  }, [currentPage])

  /** ---------------- Handle Outside Click ---------------- **/

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        subjectDropdownRef.current &&
        !subjectDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSubjectDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /** ---------------- Filter & Pagination ---------------- **/

  const filteredExams = exams.filter(
    (exam) =>
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.exam_subjects.some((subj) =>
        subj.subject_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
  )

  const filteredStudents = studentsResults.filter(
    (student) =>
      student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.idRoll.includes(searchQuery)
  )

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = currentTab === 'exam' ? filteredExams.slice(startIndex, endIndex) : []
  const currentStudentItems = currentTab === 'results' ? filteredStudents.slice(startIndex, endIndex) : []

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  )

  /** ---------------- Add / Edit / Delete Handlers ---------------- **/

  const toggleSubject = (subj: TeacherSubject) => {
    const exists = formData.selectedSubjects.some((s) => s.subject_id === subj.id)
    if (exists) {
      setFormData({
        ...formData,
        selectedSubjects: formData.selectedSubjects.filter((s) => s.subject_id !== subj.id),
      })
    } else {
      setFormData({
        ...formData,
        selectedSubjects: [...formData.selectedSubjects, { subject_id: subj.id, total_mark: 100, pass_mark: 40 }],
      })
    }
  }

  const handleAddExam = async () => {
    if (!formData.name || !formData.schedule || formData.selectedSubjects.length === 0) return
    try {
      const payload = {
        name: formData.name,
        schedule: new Date(formData.schedule).toISOString(),
        subjects: formData.selectedSubjects.map((s) => ({
          subject: s.subject_id,
          total_mark: s.total_mark,
          pass_mark: s.pass_mark,
        })),
      }
      await api.post('/exams/', payload)
      setIsAddDialogOpen(false)
      setFormData({ name: '', schedule: '', selectedSubjects: [] })
      fetchExams(currentPage)
    } catch (err) {
      console.error(formatApiError(err))
    }
  }

  const handleEditExam = async () => {
    if (!selectedExam) return
    try {
      const payload = {
        name: formData.name,
        schedule: new Date(formData.schedule).toISOString(),
        subjects: formData.selectedSubjects.map((s) => ({
          subject: s.subject_id,
          total_mark: s.total_mark,
          pass_mark: s.pass_mark,
        })),
      }
      await api.put(`/exams/${selectedExam.id}/`, payload)
      setIsEditDialogOpen(false)
      setSelectedExam(null)
      setFormData({ name: '', schedule: '', selectedSubjects: [] })
      fetchExams(currentPage)
    } catch (err) {
      console.error(formatApiError(err))
    }
  }

  const handleDeleteExam = async () => {
    if (!selectedExam) return
    try {
      await api.delete(`/exams/${selectedExam.id}/`)
      setIsDeleteDialogOpen(false)
      setSelectedExam(null)
      fetchExams(currentPage)
    } catch (err) {
      console.error(formatApiError(err))
    }
  }

  /** ---------------- Open Modals ---------------- **/

  const openEditModal = (exam: Exam) => {
    setSelectedExam(exam)
    setFormData({
      name: exam.name,
      schedule: new Date(exam.schedule).toISOString().slice(0, 16),
      selectedSubjects: exam.exam_subjects.map((subj) => ({
        subject_id: subj.subject,
        total_mark: Number(subj.total_mark),
        pass_mark: Number(subj.pass_mark),
      })),
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteModal = (exam: Exam) => {
    setSelectedExam(exam)
    setIsDeleteDialogOpen(true)
  }

  const openViewDialog = (student: StudentResult) => {
    setSelectedStudent(student)
    setIsViewDialogOpen(true)
  }

  /** ---------------- JSX ---------------- **/

  return (
    <div className="space-y-6">
      {/* Tabs, Search & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={currentTab === 'exam' ? 'Search exam or subject' : 'Search students'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as 'exam' | 'results')}>
            <TabsList>
              <TabsTrigger value="exam">Exam</TabsTrigger>
              <TabsTrigger value="results">Students Results</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {currentTab === 'exam' && (
          <Button
            className="bg-[#00A4EF] h-12 hover:bg-[#0090d1] text-white"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Exam
          </Button>
        )}
      </div>

      {/* Exam Tab */}
      {currentTab === 'exam' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Exam Name</th>
                    <th className="text-left p-4 font-medium text-gray-600">Subjects</th>
                    <th className="text-left p-4 font-medium text-gray-600">Date</th>
                    <th className="text-left p-4 font-medium text-gray-600">Time</th>
                    <th className="text-left p-4 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((exam) => {
                    const schedule = new Date(exam.schedule)
                    const dateStr = schedule.toLocaleDateString('en-GB')
                    const timeStr = schedule.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <tr key={exam.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{exam.name}</td>
                        <td className="p-4 space-x-1 flex flex-wrap gap-1">
                          {exam.exam_subjects.map((subj, idx) => {
                            const matched = subjects.find((s) => s.id === subj.subject)
                            return (
                              <Badge
                                key={idx}
                                className="bg-blue-100 text-blue-700 px-2 py-1 text-xs"
                              >
                                {subj.subject_name} ({matched?.subject_class.name} - {matched?.code})
                              </Badge>
                            )
                          })}
                        </td>
                        <td className="p-4 text-gray-600">{dateStr}</td>
                        <td className="p-4 text-gray-600">{timeStr}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50"
                              onClick={() => openEditModal(exam)}>
                              <Pencil className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => openDeleteModal(exam)}>
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {currentItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        {loading ? 'Loading...' : 'No exams found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students Results Tab */}
      {currentTab === 'results' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Student Name</th>
                    <th className="text-left p-4 font-medium text-gray-600">ID/Roll</th>
                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStudentItems.map((student) => (
                    <tr key={student.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{student.studentName}</td>
                      <td className="p-4">{student.idRoll}</td>
                      <td className="p-4">
                        <Badge
                          className={student.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                        >
                          {student.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(student)}>
                            <Download className="w-4 h-4 mr-1" /> View marksheet
                          </Button>
                          <Button size="sm" variant="outline">
                            <Send className="w-4 h-4 mr-1" /> Send result
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {currentStudentItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1} to {Math.min(endIndex, currentTab === 'exam' ? filteredExams.length : filteredStudents.length)} of {currentTab === 'exam' ? filteredExams.length : filteredStudents.length} results
        </p>
        <div className="flex items-center gap-2 flex-wrap">
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

      {/* ---------------- Add Exam Dialog ---------------- */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Add Exam</DialogTitle>
          </DialogHeader>
          <ExamForm
            subjects={subjects}
            formData={formData}
            setFormData={setFormData}
            subjectSearch={subjectSearch}
            setSubjectSearch={setSubjectSearch}
            isSubjectDropdownOpen={isSubjectDropdownOpen}
            setIsSubjectDropdownOpen={setIsSubjectDropdownOpen}
            subjectDropdownRef={subjectDropdownRef}
          />
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00A4EF] hover:bg-[#0090d1] text-white" onClick={handleAddExam}>Add Exam</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Edit Exam Dialog ---------------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
          </DialogHeader>
          
            <ExamForm
            subjects={subjects}
            formData={formData}
            setFormData={setFormData}
            subjectSearch={subjectSearch}
            setSubjectSearch={setSubjectSearch}
            isSubjectDropdownOpen={isSubjectDropdownOpen}
            setIsSubjectDropdownOpen={setIsSubjectDropdownOpen}
            subjectDropdownRef={subjectDropdownRef}
          />

          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#00A4EF] hover:bg-[#0090d1] text-white" onClick={handleEditExam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete Exam Dialog ---------------- */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle>Delete Exam</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete the exam <b>{selectedExam?.name}</b>?</p>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteExam}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- View Student Marksheet Dialog ---------------- */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl w-full">
          <DialogHeader>
            <DialogTitle>Student Marksheet</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Student Name</p>
                  <p className="font-medium">{selectedStudent.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID/Roll</p>
                  <p className="font-medium">{selectedStudent.idRoll}</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-600">Subject</th>
                      <th className="text-left p-3 font-medium text-gray-600">Total Marks</th>
                      <th className="text-left p-3 font-medium text-gray-600">Pass Marks</th>
                      <th className="text-left p-3 font-medium text-gray-600">Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedStudent.subjects.map((subj, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3">{subj.name}</td>
                        <td className="p-3">{subj.totalMarks}</td>
                        <td className="p-3">{subj.passMarks}</td>
                        <td className="p-3">{subj.obtainMarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="font-medium">Status:</p>
                <Badge
                  className={selectedStudent.status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                >
                  {selectedStudent.status}
                </Badge>
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

/** ---------------- Reusable ExamForm Component ---------------- **/
interface ExamFormProps {
  subjects: TeacherSubject[]
  formData: {
    name: string
    schedule: string
    selectedSubjects: ExamSubject[]
  }
  setFormData: React.Dispatch<React.SetStateAction<{
    name: string
    schedule: string
    selectedSubjects: ExamSubject[]
  }>>
  subjectSearch: string
  setSubjectSearch: React.Dispatch<React.SetStateAction<string>>
  isSubjectDropdownOpen: boolean
  setIsSubjectDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>
  subjectDropdownRef: React.RefObject<HTMLDivElement | null>
}

const ExamForm: React.FC<ExamFormProps> = ({
  subjects,
  formData,
  setFormData,
  subjectSearch,
  setSubjectSearch,
  isSubjectDropdownOpen,
  setIsSubjectDropdownOpen,
  subjectDropdownRef,
}) => {
  const toggleSubject = (subj: TeacherSubject) => {
    const exists = formData.selectedSubjects.some((s) => s.subject_id === subj.id)
    if (exists) {
      setFormData({
        ...formData,
        selectedSubjects: formData.selectedSubjects.filter((s) => s.subject_id !== subj.id),
      })
    } else {
      setFormData({
        ...formData,
        selectedSubjects: [...formData.selectedSubjects, { subject_id: subj.id, total_mark: 100, pass_mark: 40 }],
      })
    }
  }

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(subjectSearch.toLowerCase())
  )

  return (
      <>
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Exam Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <Input
          type="datetime-local"
          value={formData.schedule}
          onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
        />
      </div>

      {/* Subject Dropdown */}
      <div className="relative" ref={subjectDropdownRef}>
        <Input
          placeholder="Search subjects by name or code"
          value={subjectSearch}
          onChange={(e) => setSubjectSearch(e.target.value)}
          onFocus={() => setIsSubjectDropdownOpen(true)}
        />
        {isSubjectDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded border bg-white shadow">
            {filteredSubjects.map((subj) => {
              const selected = formData.selectedSubjects.some((s) => s.subject_id === subj.id)
              return (
                <div
                  key={subj.id}
                  className={`cursor-pointer flex justify-between items-center px-3 py-2 hover:bg-gray-100 ${selected ? 'bg-gray-100' : ''}`}
                  onClick={() => toggleSubject(subj)}
                >
                  <span>{subj.name} ({subj.subject_class.name} - {subj.code})</span>
                  {selected && <span>✓</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Subjects */}
      {formData.selectedSubjects.length > 0 && (
        <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
          {formData.selectedSubjects.map((s) => {
            const subj = subjects.find((subj) => subj.id === s.subject_id)!
            return (
              <div key={s.subject_id} className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <span className="w-full sm:w-52">{subj.name} ({subj.subject_class.name} - {subj.code})</span>
                <Input
                  type="number"
                  placeholder="Total Mark"
                  className="w-full sm:w-24"
                  value={s.total_mark}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setFormData({
                      ...formData,
                      selectedSubjects: formData.selectedSubjects.map((sub) =>
                        sub.subject_id === s.subject_id ? { ...sub, total_mark: value } : sub
                      ),
                    })
                  }}
                />
                <Input
                  type="number"
                  placeholder="Pass Mark"
                  className="w-full sm:w-24"
                  value={s.pass_mark}
                  onChange={(e) => {
                    const value = Number(e.target.value)
                    setFormData({
                      ...formData,
                      selectedSubjects: formData.selectedSubjects.map((sub) =>
                        sub.subject_id === s.subject_id ? { ...sub, pass_mark: value } : sub
                      ),
                    })
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => toggleSubject(subj)}>Remove</Button>
              </div>
            )
          })}
        </div>
      )}
      </>
  )
}