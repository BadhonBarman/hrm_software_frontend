'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Cookies from 'js-cookie'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const LessonCoveredChart = () => {
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
        labels: isAdmin
            ? ['New subscribers', 'Renewed subscriptions', 'Cancelled subscriptions']
            : ['Bangla', 'English', 'Math', 'History'],
        colors: isAdmin
            ? ['#00A4EF', '#FFB900', '#000000']
            : ['#00A4EF', '#FFB900', '#000000', '#F25022'],
        legend: {
            position: 'right',
            fontSize: '14px',
            height: undefined,
            floating: false,
            offsetY: 0,
            itemMargin: {
                vertical: 5
            },
            formatter: (seriesName, opts) => {
                const value = opts.w.globals.series[opts.seriesIndex]
                return `${seriesName} - ${value}%`
            }
        },
        dataLabels: {
            enabled: false
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                legend: {
                    position: 'bottom'
                }
            }
        }]
    }

    const series = isAdmin ? [50, 40, 10] : [10, 40, 30, 20]

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                        {isAdmin ? 'Subscription Growth' : 'Lesson covered'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center overflow-hidden">
                    <div className="w-full max-w-full overflow-auto">
                        <Chart
                            options={options}
                            series={series}
                            type="donut"
                            height={280}
                            width="100%"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* global styles to constrain apexcharts legend and enable scrolling when it overflows */}
            <style>{`
                .apexcharts-legend { max-height: 220px; overflow-y: auto; overflow-x: hidden; padding-right: 6px; }
                .apexcharts-legend .apexcharts-legend-series { white-space: nowrap; }
                @media (max-width: 640px) { .apexcharts-legend { max-height: none; overflow: visible; } }
                /* ensure legend sits within card and doesn't overflow horizontally */
                .apexcharts-svg { overflow: visible !important; }
            `}</style>
        </>
    )
}

export default LessonCoveredChart
