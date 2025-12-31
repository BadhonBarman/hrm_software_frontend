'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import { api, formatApiError } from '@/lib/api-client'
import { api as apiAdmin, formatApiError as formatApiErrorAdmin } from '@/lib/api-admin'
import Cookies from 'js-cookie'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface GraphItem {
    month: string
    count: number
    growth_percentage: number
}

const DynamicStudentsChart: React.FC = () => {
    const [data, setData] = useState<GraphItem[]>([])
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
                    const res = await apiAdmin.get<{ teacher_graph: GraphItem[] }>('/dashboard/forecast/')
                    setData(res.teacher_graph)
                } else {
                    const res = await api.get<{ student_graph: GraphItem[] }>('/dashboard/forecast/')
                    setData(res.student_graph)
                }
            } catch (err) {
                setError(userType === 'admin' ? formatApiErrorAdmin(err) : formatApiError(err))
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userType])

    if (loading) return <p>Loading chart...</p>
    if (error) return <p className="text-red-500">{error}</p>
    if (!data || data.length === 0) return <p>No data available</p>

    const chartTitle = userType === 'admin' ? 'Teachers' : 'Students'
    const chartName = userType === 'admin' ? 'Teachers' : 'Students'

    const chartOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
        dataLabels: { enabled: false },
        colors: ['#00A4EF'],
        xaxis: { categories: data.map((item) => item.month) },
        yaxis: { labels: { formatter: (val) => `${val}` } },
        grid: { borderColor: '#f1f1f1' },
    }

    const chartSeries = [
        {
            name: chartName,
            data: data.map((item) => item.count),
        },
    ]

    return (
        <Card>
            <CardHeader className="flex items-center justify-between">
                <CardTitle>{chartTitle}</CardTitle>
                <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {data[data.length - 1]?.growth_percentage ?? 0}% Growth
                </Badge>
            </CardHeader>
            <CardContent>
                <Chart options={chartOptions} series={chartSeries} type="bar" height={250} />
            </CardContent>
        </Card>
    )
}

export default DynamicStudentsChart
