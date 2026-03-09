'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { api, formatApiError } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronLeft, ChevronRight, EyeIcon, BookOpen, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface ResourceAccessItem {
    id: number
    title: string
    resource_title: string
    access_type: string
    access_type_display: string
    is_accessable: boolean
    given_date: string
    created: string
}

interface ApiResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: ResourceAccessItem[]
}

export default function ResourceAccessClient() {
    const [resources, setResources] = useState<ResourceAccessItem[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

    const fetchResources = async (page = 1) => {
        setLoading(true)
        setError(null)
        try {
            const params = new URLSearchParams()
            params.append('page', page.toString())
            if (searchQuery) params.append('search', searchQuery)

            const data = await api.get<ApiResponse>(`/employee/resource-access/?${params.toString()}`)
            setResources(data.results)
            setCurrentPage(data.current_page)
            setTotalPages(data.total_pages)

            // Update URL without refresh
            const newUrl = params.toString() ? `?${params.toString()}` : ''
            // router.push(newUrl, { scroll: false })
        } catch (err) {
            setError(formatApiError(err))
            toast.error('Failed to load resources')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchResources(1)
        }, 500)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    useEffect(() => {
        fetchResources(currentPage)
    }, [currentPage])

    const getAccessTypeColor = (type: string) => {
        switch (type) {
            case 'all_employee': return 'text-green-600 bg-green-50 border-green-200'
            case 'selected_department': return 'text-blue-600 bg-blue-50 border-blue-200'
            case 'selected_employee': return 'text-purple-600 bg-purple-50 border-purple-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search resources..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-white border-gray-200"
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
            </div>

            {/* List Table */}
            <Card className="border-none shadow-sm bg-white rounded-xl overflow-hidden">
                <CardContent className="!p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Access Type</th>
                                    <th className="text-left py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Given Date</th>
                                    <th className="text-right py-4 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && resources.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                                                <p>Loading resources...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : resources.map((item) => (
                                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">{item.title}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-gray-600 font-medium">{item.resource_title}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={cn(
                                                "px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap",
                                                getAccessTypeColor(item.access_type)
                                            )}>
                                                {item.access_type_display}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-sm text-gray-600 whitespace-nowrap">
                                                {item.given_date ? format(new Date(item.given_date), 'MMM dd, yyyy') : '-'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Button
                                                onClick={() => router.push(`/dashboard/resource-access/${item.id}`)}
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-2 font-medium"
                                            >
                                                <EyeIcon size={16} />
                                                View Details
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!loading && resources.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <BookOpen className="h-8 w-8 text-gray-300" />
                                                <p>No resources found</p>
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
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        Showing page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .map((p, i, arr) => (
                                    <React.Fragment key={p}>
                                        {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">...</span>}
                                        <Button
                                            variant={currentPage === p ? 'default' : 'outline'}
                                            size="sm"
                                            className={cn(
                                                "h-9 w-9 px-0",
                                                currentPage === p ? "bg-blue-600 text-white" : "text-gray-600"
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
                            className="h-9 w-9"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages || loading}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
