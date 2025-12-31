import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    icon: LucideIcon
    label: string
    value: string | number
    iconBgColor?: string
}

const StatCard = ({ icon: Icon, label, value, iconBgColor = 'bg-gray-100' }: StatCardProps) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${iconBgColor}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 font-medium">{label}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default StatCard
