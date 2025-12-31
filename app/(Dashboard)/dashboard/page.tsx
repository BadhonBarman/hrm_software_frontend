import React from 'react'
import StatCard from '@/components/dashboard/StatCard'
import StudentsChart from '@/components/dashboard/StudentsChart'
import AttendanceChart from '@/components/dashboard/AttendanceChart'
import PerformanceChart from '@/components/dashboard/PerformanceChart'
import LessonCoveredChart from '@/components/dashboard/LessonCoveredChart'
import { GraduationCap, BookOpen, FileText, Calendar } from 'lucide-react'
import DynamicStatCards from '@/components/dashboard/DynamicStatCards'
import DynamicStudentsChart from '@/components/dashboard/DynamicStudentsChart'

export default function DashboardPage() {
    return (
        <>
            {/* Stat Cards */}
             <DynamicStatCards />
            {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={GraduationCap}
                    label="Total Students"
                    value="1200"
                    iconBgColor="bg-blue-100"
                />
                <StatCard
                    icon={BookOpen}
                    label="Total Classes"
                    value="12"
                    iconBgColor="bg-purple-100"
                />
                <StatCard
                    icon={FileText}
                    label="Total Exams"
                    value="710"
                    iconBgColor="bg-green-100"
                />
                <StatCard
                    icon={Calendar}
                    label="Upcoming lesson"
                    value="31"
                    iconBgColor="bg-orange-100"
                />
            </div> */}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* <StudentsChart /> */}
                <DynamicStudentsChart />
                <AttendanceChart />
                <PerformanceChart />
                <LessonCoveredChart />
            </div>
        </>
    )
}
