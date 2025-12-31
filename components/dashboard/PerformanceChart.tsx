'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Cookies from 'js-cookie'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const PerformanceChart = () => {
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
            type: 'bar',
            toolbar: { show: false },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '50%',
            }
        },
        dataLabels: { enabled: false },
        colors: ['#00A4EF', '#FFB900', '#F25022'],
        xaxis: {
            categories: isAdmin
                ? ['Exams', 'Homework', 'Lesson Plans', 'Classes Schedule']
                : ['1st term', '2nd term', 'Test exam', 'Mid term', 'Final'],
        },
        legend: {
            position: 'top',
            horizontalAlign: 'left',
        },
        grid: {
            borderColor: '#f1f1f1',
        }
    }

    const series = isAdmin
        ? [
            { name: 'Best', data: [3500, 15000, 800, 15000] },
            { name: 'Average', data: [0, 0, 0, 0] },
            { name: 'Bad', data: [0, 0, 800, 0] }
        ]
        : [
            { name: 'Best', data: [45, 80, 35, 75, 50] },
            { name: 'Average', data: [50, 55, 60, 55, 85] },
            { name: 'Bad', data: [0, 0, 55, 0, 0] }
        ]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    {isAdmin ? 'Usage by Teachers' : 'Student Performance'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Chart
                    options={options}
                    series={series}
                    type="bar"
                    height={280}
                />
            </CardContent>
        </Card>
    )
}

export default PerformanceChart
