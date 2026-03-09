'use client'

import React, { useEffect, useState } from 'react'
import { api, formatApiError } from '@/lib/api-client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Category {
    id: number
    name: string
    description: string
    status: boolean
}

interface FeedbackFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

const FEED_TYPES = [
    { value: 'complaint', label: 'Complaint' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'appreciation', label: 'Appreciation' },
    { value: 'other', label: 'Other' },
]

export default function FeedbackForm({ isOpen, onClose, onSuccess }: FeedbackFormProps) {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        category: '',
        feed_type: '',
        subject: '',
        description: '',
    })

    useEffect(() => {
        if (isOpen) {
            fetchCategories()
        }
    }, [isOpen])

    const fetchCategories = async () => {
        setLoading(true)
        try {
            const data = await api.get<Category[]>('/feedback/categories/')
            setCategories(data.filter(c => c.status))
        } catch (err) {
            toast.error('Failed to load feedback categories')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.category || !formData.feed_type || !formData.subject || !formData.description) {
            toast.error('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        try {
            await api.post('/employee/feedback/', {
                category: parseInt(formData.category),
                feed_type: formData.feed_type,
                subject: formData.subject,
                description: formData.description,
            })
            toast.success('Feedback submitted successfully')
            onSuccess()
            onClose()
            setFormData({ category: '', feed_type: '', subject: '', description: '' })
        } catch (err) {
            toast.error(formatApiError(err))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                        Give Feedback
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="text-sm font-semibold text-gray-700">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(v) => setFormData({ ...formData, category: v })}
                                disabled={loading}
                            >
                                <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200">
                                    <SelectValue placeholder={loading ? "Loading..." : "Select Category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type" className="text-sm font-semibold text-gray-700">Feedback Type</Label>
                            <Select
                                value={formData.feed_type}
                                onValueChange={(v) => setFormData({ ...formData, feed_type: v })}
                            >
                                <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200">
                                    <SelectValue placeholder="Select Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FEED_TYPES.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-semibold text-gray-700">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="What is this about?"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="h-11 bg-gray-50/50 border-gray-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Provide more details..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[120px] bg-gray-50/50 border-gray-200 resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="h-11 px-6 font-medium text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting}
                            className="h-11 px-8 font-bold bg-[#007BF3] hover:bg-[#0066cc] text-white shadow-lg shadow-blue-100 transition-all"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                'Submit Feedback'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
