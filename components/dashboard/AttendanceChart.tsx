'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Cookies from 'js-cookie'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const AttendanceChart = () => {
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

    const isAdmin = userType === 'admin'

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'donut',
        },
        labels: isAdmin ? ['Active Teacher', 'Inactive Teachers'] : ['Present', 'Absent'],
        colors: ['#00A4EF', '#FFB900'],
        legend: {
            position: 'bottom',
            fontSize: '14px',
        },
        dataLabels: {
            enabled: true,
            formatter: (val) => `${Math.round(Number(val))}%`
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: false,
                    }
                }
            }
        }
    }

    const series = [70, 30]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    {isAdmin ? 'Subscription Status' : 'Attendance'}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <Chart
                    options={options}
                    series={series}
                    type="donut"
                    height={280}
                />
            </CardContent>
        </Card>
    )
}

export default AttendanceChart
