'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const StudentsChart = () => {
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            fontFamily: 'inherit',
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '60%',
            }
        },
        dataLabels: { enabled: false },
        colors: ['#00A4EF'],
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        },
        yaxis: {
            labels: {
                formatter: (val) => `${val}k`
            }
        },
        grid: {
            borderColor: '#f1f1f1',
        }
    }

    const series = [{
        name: 'Growth',
        data: [85, 52, 78, 65, 48, 85, 35, 60, 85, 60, 65]
    }]

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Students</CardTitle>
                    <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +8% Growth
                    </Badge>
                </div>
                <p className="text-3xl font-bold mt-2">78k</p>
            </CardHeader>
            <CardContent>
                <Chart
                    options={options}
                    series={series}
                    type="bar"
                    height={250}
                />
            </CardContent>
        </Card>
    )
}

export default StudentsChart
