'use client'

import React, { useEffect, useState } from 'react'
import { GraduationCap, BookOpen, FileText, Calendar, Users, CheckCircle } from 'lucide-react'
import StatCard from '@/components/dashboard/StatCard'
import { api, formatApiError } from '@/lib/api-client'
import { api as apiAdmin, formatApiError as formatApiErrorAdmin } from '@/lib/api-admin'
import Cookies from 'js-cookie'

interface UpcomingClass {
    id: number
    subject: string
    class_name: string
    day: string
    start_time: string
    end_time: string
}

interface DashboardForecastResponse {
    total_students: number
    total_classes: number
    total_exams: number
    upcoming_classes: UpcomingClass[]
}

interface AdminDashboardResponse {
    total_teachers: number
    active_subscription: number
    total_lesson_plans: number
    total_exams: number
    teacher_graph: Array<{
        month: string
        count: number
        growth_percentage: number
    }>
}

const DynamicStatCards: React.FC = () => {
    const [data, setData] = useState<DashboardForecastResponse | null>(null)
    const [adminData, setAdminData] = useState<AdminDashboardResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userType, setUserType] = useState<string | null>(null)

    useEffect(() => {
        const user = Cookies.get('user')
        if (user) {
            try {
                const userData = JSON.parse(user)
                setUserType(userData.user_type)
            } catch (error) {
                console.error('Error parsing user cookie:', error)
            }
        }
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            if (!userType) return

            try {
                setLoading(true)
                if (userType === 'admin') {
                    const res = await apiAdmin.get<AdminDashboardResponse>('/dashboard/forecast/')
                    setAdminData(res)
                } else {
                    const res = await api.get<DashboardForecastResponse>('/dashboard/forecast/')
                    setData(res)
                }
            } catch (err) {
                setError(userType === 'admin' ? formatApiErrorAdmin(err) : formatApiError(err))
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userType])

    if (loading) return <p>Loading stats...</p>
    if (error) return <p className="text-red-500">{error}</p>

    if (userType === 'admin') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Teachers"
                    value={adminData?.total_teachers.toString() || '0'}
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    icon={CheckCircle}
                    label="Active Subscriptions"
                    value={adminData?.active_subscription.toString() || '0'}
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    icon={Calendar}
                    label="Total Lesson Plans"
                    value={adminData?.total_lesson_plans.toString() || '0'}
                    iconBgColor="bg-purple-100"
                />
                <StatCard
                    icon={FileText}
                    label="Total Exams"
                    value={adminData?.total_exams.toString() || '0'}
                    iconBgColor="bg-orange-100"
                />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={GraduationCap}
                label="Total Students"
                value={data?.total_students.toString() || '0'}
                iconBgColor="bg-blue-100"
            />
            <StatCard
                icon={BookOpen}
                label="Total Classes"
                value={data?.total_classes.toString() || '0'}
                iconBgColor="bg-purple-100"
            />
            <StatCard
                icon={FileText}
                label="Total Exams"
                value={data?.total_exams.toString() || '0'}
                iconBgColor="bg-green-100"
            />
            <StatCard
                icon={Calendar}
                label="Upcoming Lessons"
                value={data?.upcoming_classes.length.toString() || '0'}
                iconBgColor="bg-orange-100"
            />
        </div>
    )
}

export default DynamicStatCards
