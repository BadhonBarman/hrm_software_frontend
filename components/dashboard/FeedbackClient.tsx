'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, formatApiError } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, MessageSquare, Plus, Filter, X, MessageCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import FeedbackForm from './FeedbackForm'

interface FeedbackItem {
    id: number
    employee: number
    employee_name: string
    category: number
    category_detail: {
        id: number
        name: string
        description: string
        status: boolean
    }
    subject: string
    description: string
    attachment: string | null
    status: string
    status_display: string
    feed_type: string
    feed_type_display: string
    created: string
    updated: string
}

interface ApiResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: FeedbackItem[]
}

export default function FeedbackClient() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

    const fetchFeedback = async (page = 1) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            params.append('page', page.toString())
            if (searchQuery) params.append('search', searchQuery)

            const data = await api.get<ApiResponse>(`/employee/feedback/?${params.toString()}`)
            setFeedback(data.results)
            setCurrentPage(data.current_page)
            setTotalPages(data.total_pages)
        } catch (err) {
            toast.error('Failed to load feedback')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchFeedback(1)
        }, 500)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    useEffect(() => {
        fetchFeedback(currentPage)
    }, [currentPage])

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'resolved': return 'text-green-600 bg-green-50 border-green-200'
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200'
            case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getTypeColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'complaint': return 'text-red-700 bg-red-50'
            case 'suggestion': return 'text-blue-700 bg-blue-50'
            case 'appreciation': return 'text-green-700 bg-green-50'
            default: return 'text-gray-700 bg-gray-50'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search your feedback..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-11 bg-white border-gray-200 rounded-xl"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                <Button
                    onClick={() => setIsFormOpen(true)}
                    className="w-full md:w-auto h-11 px-6 bg-[#007BF3] hover:bg-[#0066cc] text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
                >
                    <Plus size={20} strokeWidth={3} />
                    Give Feedback
                </Button>
            </div>

            {/* List Table */}
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="!p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-5 px-6 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Feedback Details</th>
                                    <th className="text-left py-5 px-6 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Category</th>
                                    <th className="text-left py-5 px-6 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Type</th>
                                    <th className="text-left py-5 px-6 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Status</th>
                                    <th className="text-left py-5 px-6 text-xs font-bold text-gray-400 border-none uppercase tracking-widest">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && feedback.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                                                <p className="text-gray-500 font-medium">Loading your feedback history...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : feedback.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col gap-1 max-w-xs md:max-w-md">
                                                <span className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors">
                                                    {item.subject}
                                                </span>
                                                <p className="text-sm text-gray-500 line-clamp-1 italic">
                                                    "{item.description}"
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-blue-400" />
                                                <span className="text-sm text-gray-700 font-semibold">
                                                    {item.category_detail.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight",
                                                getTypeColor(item.feed_type)
                                            )}>
                                                {item.feed_type_display}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <span className={cn(
                                                "px-3 py-1 rounded-lg text-xs font-bold border",
                                                getStatusColor(item.status)
                                            )}>
                                                {item.status_display}
                                            </span>
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {format(new Date(item.created), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                    {format(new Date(item.created), 'HH:mm aaa')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && feedback.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                                    <MessageCircle size={32} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-bold text-gray-900">No feedback yet</p>
                                                    <p className="text-sm text-gray-500">Your voices matter! Click the button above to share your thoughts.</p>
                                                </div>
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
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-gray-500 font-medium">
                        Showing page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-1.5">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                                        <Button
                                            variant={currentPage === p ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                "h-10 w-10 rounded-xl font-bold",
                                                currentPage === p ? "bg-[#007BF3] text-white" : "text-gray-600"
                                            )}
                                            onClick={() => setCurrentPage(p)}
                                            disabled={loading}
                                        >
                                            {p}
                                        </Button>
                                    </React.Fragment>
                                ))
                            }
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-10 w-10 rounded-xl"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            <FeedbackForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSuccess={() => fetchFeedback(1)}
            />
        </div>
    )
}
