'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, XCircle } from 'lucide-react'

// Dummy Data Types
interface UserEarning {
    id: number
    user: string
    email: string
    subscription: string
    totalSpent: number
    purchaseDate: string
    status: 'Active' | 'Inactive'
}

// Dummy Data
const dummyEarnings: UserEarning[] = [
    { id: 1, user: 'Mingulu Marma', email: 'mingulu@gmail.com', subscription: 'Monthly', totalSpent: 550, purchaseDate: '12-08-2025', status: 'Active' },
    { id: 2, user: 'Mingulu Marma', email: 'mingulu@gmail.com', subscription: 'Monthly', totalSpent: 550, purchaseDate: '12-08-2025', status: 'Active' },
    { id: 3, user: 'Mingulu Marma', email: 'mingulu@gmail.com', subscription: 'Monthly', totalSpent: 550, purchaseDate: '12-08-2025', status: 'Active' },
]

export default function SubscriptionClient() {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="space-y-6">
            {/* Top Section: Search */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="search users"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 h-14 bg-white text-base rounded-lg"
                    />
                </div>
            </div>

            {/* User-wise earnings */}
            <Card className="bg-white">
                <CardHeader className="px-8 py-6">
                    <CardTitle className="text-2xl font-bold">User-wise earnings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-8 py-4 font-semibold text-gray-900">User</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-900">Email</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-900">Subscription</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-900">Total spent</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-900">Purchase date</th>
                                    <th className="text-left px-4 py-4 font-semibold text-gray-900">Status</th>
                                    <th className="text-left px-8 py-4 font-semibold text-gray-900">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyEarnings.map((earning) => (
                                    <tr key={earning.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                        <td className="px-8 py-5 font-normal text-gray-900">{earning.user}</td>
                                        <td className="px-4 py-5 text-gray-700">{earning.email}</td>
                                        <td className="px-4 py-5 text-gray-700">{earning.subscription}</td>
                                        <td className="px-4 py-5 text-gray-700">${earning.totalSpent}</td>
                                        <td className="px-4 py-5 text-gray-700">{earning.purchaseDate}</td>
                                        <td className="px-4 py-5">
                                            <span className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-500">
                                                {earning.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <Button
                                                variant="outline"
                                                className="border border-red-500/20 text-red-500 hover:bg-red-50 hover:text-red-600 px-4 h-9 rounded-md"
                                            >
                                                <XCircle className="w-4 h-4 mr-2" /> Cancel
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
