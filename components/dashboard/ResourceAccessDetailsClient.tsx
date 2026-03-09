'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, formatApiError, downloadFile } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Link as LinkIcon, Download, Globe, Calendar, Info, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface Attachment {
    id: number
    title: string
    description: string
    attachment_type: 'url' | 'file'
    attachment_type_display: string
    attachment: string | null
    url: string | null
    created: string
}

interface ResourceDetails {
    id: number
    title: string
    description: string
    resource_type: string
    resource_type_display: string
    condition_type: string
    condition_type_display: string
    attachments: Attachment[]
    created: string
}

interface ResourceAccessDetails {
    id: number
    title: string
    description: string
    resource: number
    resource_details: ResourceDetails
    access_type: string
    access_type_display: string
    is_accessable: boolean
    given_date: string
    created: string
}

export default function ResourceAccessDetailsClient({ id }: { id: string }) {
    const [data, setData] = useState<ResourceAccessDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const result = await api.get<ResourceAccessDetails>(`/employee/resource-access/${id}/`)
                setData(result)
            } catch (err) {
                toast.error('Failed to load resource details', {
                    description: formatApiError(err)
                })
                router.push('/dashboard/resource-access')
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [id, router])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-gray-500 font-medium">Loading details...</p>
            </div>
        )
    }

    if (!data) return null

    const handleDownload = async (attachment: Attachment) => {
        if (!attachment.attachment) return
        try {
            await downloadFile(attachment.attachment, attachment.title || 'download')
            toast.success('Download started')
        } catch (err) {
            toast.error('Download failed')
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="hover:bg-white shadow-sm"
                >
                    <ArrowLeft size={20} />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
                    <p className="text-sm text-gray-500">Resource Access ID: #{data.id}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Info size={18} className="text-blue-600" />
                                Resource Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
                                <p className="text-lg font-medium text-gray-900">{data.resource_details.title}</p>
                            </div>

                            {data.resource_details.description && (
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                                    <p className="text-gray-600 leading-relaxed text-sm bg-gray-50 p-4 rounded-lg italic">
                                        {data.resource_details.description}
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Globe size={16} />
                                        </div>
                                        <span className="font-medium text-gray-700">{data.resource_details.resource_type_display}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Condition</label>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                                            <Clock size={16} />
                                        </div>
                                        <span className="font-medium text-gray-700">{data.resource_details.condition_type_display}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" />
                                Attachments ({data.resource_details.attachments.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 gap-4">
                                {data.resource_details.attachments.length > 0 ? (
                                    data.resource_details.attachments.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                                                    file.attachment_type === 'url' ? "bg-cyan-50 text-cyan-600" : "bg-indigo-50 text-indigo-600"
                                                )}>
                                                    {file.attachment_type === 'url' ? <LinkIcon size={22} /> : <FileText size={22} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{file.title}</h4>
                                                    <p className="text-xs text-gray-500">{file.attachment_type_display}</p>
                                                </div>
                                            </div>

                                            {file.attachment_type === 'url' ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white"
                                                    asChild
                                                >
                                                    <a href={file.url || '#'} target="_blank" rel="noopener noreferrer">
                                                        Open Link
                                                    </a>
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="rounded-full hover:bg-blue-600 hover:text-white"
                                                    onClick={() => handleDownload(file)}
                                                >
                                                    <Download size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-400 italic">
                                        No attachments available for this resource.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Access Info */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-blue-100 uppercase tracking-widest opacity-80">Access Granted</label>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-blue-200" />
                                    <span className="text-xl font-bold">
                                        {data.given_date ? format(new Date(data.given_date), 'MMMM dd, yyyy') : '-'}
                                    </span>
                                </div>
                            </div>

                            <div className="h-px bg-white/20 w-full" />

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-blue-100 uppercase tracking-widest opacity-80">Access Type</label>
                                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium backdrop-blur-sm">
                                    {data.access_type_display}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs font-medium text-blue-50">Currently Active</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="border-b border-gray-100 italic">
                            <CardTitle className="text-sm font-semibold text-gray-500">System Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Record Created</span>
                                <span className="font-medium text-gray-900">{format(new Date(data.created), 'MMM dd, HH:mm')}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">Accessibility</span>
                                <span className={cn(
                                    "font-bold",
                                    data.is_accessable ? "text-green-600" : "text-red-600"
                                )}>
                                    {data.is_accessable ? 'Permitted' : 'Revoked'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
