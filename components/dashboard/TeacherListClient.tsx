'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, CheckCircle, XCircle, Ban, Undo2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Dummy Data Types
interface TeacherRequest {
    id: number
    name: string
    email: string
    country: string
    designation: string
    primarySubject: string
}

interface Teacher {
    id: number
    name: string
    email: string
    country: string
    designation: string
    primarySubject: string
    status: 'active' | 'banned'
}

// Dummy Data
const dummyRequests: TeacherRequest[] = [
    { id: 1, name: 'Mingulu Marma', email: 'mingulu@gmail.com', country: 'Bangladesh', designation: 'Professor', primarySubject: 'History' },
    { id: 2, name: 'Plabon Saha', email: 'plabon@gmail.com', country: 'India', designation: 'Teacher', primarySubject: 'English' },
    { id: 3, name: 'Ankon Marma', email: 'ankonmarma@mail.com', country: 'Malaysia', designation: 'Home Tutor', primarySubject: 'Mathematics' },
    { id: 4, name: 'Chailau Marma', email: 'mrchailau@gmail.com', country: 'Indonesia', designation: 'Professor', primarySubject: 'Economics' },
    { id: 5, name: 'Baul Suzon', email: 'suzonbaul@gmail.com', country: 'South Africa', designation: 'Home Tutor', primarySubject: 'Phycology' },
    { id: 6, name: 'Ankit Marma', email: 'marmaank@gmail.com', country: 'Ghana', designation: 'Home Tutor', primarySubject: 'Philosophy' },
]

const dummyTeachers: Teacher[] = [
    { id: 1, name: 'Mingulu Marma', email: 'mingulu@gmail.com', country: 'Bangladesh', designation: 'Professor', primarySubject: 'History', status: 'active' },
    { id: 2, name: 'Plabon Saha', email: 'plabon@gmail.com', country: 'India', designation: 'Teacher', primarySubject: 'English', status: 'active' },
    { id: 3, name: 'Ankon Marma', email: 'ankonmarma@mail.com', country: 'Malaysia', designation: 'Home Tutor', primarySubject: 'Mathematics', status: 'banned' },
    { id: 4, name: 'Chailau Marma', email: 'mrchailau@gmail.com', country: 'Indonesia', designation: 'Professor', primarySubject: 'Economics', status: 'active' },
    { id: 5, name: 'Baul Suzon', email: 'suzonbaul@gmail.com', country: 'South Africa', designation: 'Home Tutor', primarySubject: 'Phycology', status: 'active' },
    { id: 6, name: 'Ankit Marma', email: 'marmaank@gmail.com', country: 'Ghana', designation: 'Home Tutor', primarySubject: 'Philosophy', status: 'banned' },
]

export default function TeacherListClient() {
    const [searchQuery, setSearchQuery] = useState('')

    // Filter logic (visual only for now)
    const filterRequests = (data: TeacherRequest[]) => {
        return data.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.primarySubject.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }

    const filterTeachers = (data: Teacher[]) => {
        return data.filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.primarySubject.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                    type="text"
                    placeholder="search teacher"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 bg-white"
                />
            </div>

            <Tabs defaultValue="requests" className="w-full">
                <TabsList className="w-full justify-start bg-transparent p-0 border-b border-gray-200 rounded-none h-auto">
                    <TabsTrigger
                        value="requests"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-0 mr-8 text-lg font-semibold text-gray-500 data-[state=active]:text-black bg-transparent"
                    >
                        All Requests
                    </TabsTrigger>
                    <TabsTrigger
                        value="teachers"
                        className="data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none rounded-none px-0 pb-3 pt-0 text-lg font-semibold text-gray-500 data-[state=active]:text-black bg-transparent"
                    >
                        All Teachers
                    </TabsTrigger>
                </TabsList>

                {/* All Requests Tab */}
                <TabsContent value="requests" className="mt-6">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-gray-50/50">
                                        <tr>
                                            <th className="text-left p-4 font-medium text-gray-500">Name</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Email</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Country</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Designation</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Primary Subject</th>
                                            <th className="text-right p-4 font-medium text-gray-500 pr-8">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filterRequests(dummyRequests).map((request) => (
                                            <tr key={request.id} className="border-b hover:bg-gray-50/50">
                                                <td className="p-4 font-medium">{request.name}</td>
                                                <td className="p-4">{request.email}</td>
                                                <td className="p-4">{request.country}</td>
                                                <td className="p-4">{request.designation}</td>
                                                <td className="p-4">{request.primarySubject}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        <Button
                                                            variant="outline"
                                                            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 px-4"
                                                        >
                                                            <XCircle className="w-4 h-4 mr-2" /> Reject
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 px-4"
                                                        >
                                                            <CheckCircle className="w-4 h-4 mr-2" /> Accept
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* All Teachers Tab */}
                <TabsContent value="teachers" className="mt-6">
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-gray-50/50">
                                        <tr>
                                            <th className="text-left p-4 font-medium text-gray-500">Name</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Email</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Country</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Designation</th>
                                            <th className="text-left p-4 font-medium text-gray-500">Primary Subject</th>
                                            <th className="text-right p-4 font-medium text-gray-500 pr-8">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filterTeachers(dummyTeachers).map((teacher) => (
                                            <tr key={teacher.id} className="border-b hover:bg-gray-50/50">
                                                <td className="p-4 font-medium">{teacher.name}</td>
                                                <td className="p-4">{teacher.email}</td>
                                                <td className="p-4">{teacher.country}</td>
                                                <td className="p-4">{teacher.designation}</td>
                                                <td className="p-4">{teacher.primarySubject}</td>
                                                <td className="p-4 text-right">
                                                    <div className="flex justify-end gap-3">
                                                        {teacher.status === 'active' ? (
                                                            <Button
                                                                variant="outline"
                                                                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 px-6"
                                                            >
                                                                <Ban className="w-4 h-4 mr-2" /> Ban
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outline"
                                                                className="border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600 px-4"
                                                            >
                                                                <Undo2 className="w-4 h-4 mr-2" /> Unban
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Pagination (Visual only) */}
            <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-600 font-medium">
                    Showing 1 to 5 of 24 results
                </p>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="w-10 h-10" disabled>
                        &lt;
                    </Button>
                    <Button variant="default" size="icon" className="w-10 h-10 bg-blue-100 text-blue-600 hover:bg-blue-200 border-none">
                        1
                    </Button>
                    <Button variant="outline" size="icon" className="w-10 h-10">
                        2
                    </Button>
                    <Button variant="outline" size="icon" className="w-10 h-10">
                        3
                    </Button>
                    <span className="px-2">...</span>
                    <Button variant="outline" size="icon" className="w-10 h-10">
                        10
                    </Button>
                    <Button variant="outline" size="icon" className="w-10 h-10">
                        &gt;
                    </Button>
                </div>
            </div>
        </div>
    )
}
