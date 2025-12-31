'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Trash2, XCircle, Calendar as CalendarIcon, Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

// Dummy Data Types
interface SubscriptionPlan {
    id: number
    name: string
    duration: string
    price: number
    status: 'Active' | 'Inactive'
    color: string
}

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
const dummyPlans: SubscriptionPlan[] = [
    { id: 1, name: 'Weekly', duration: '7 Days', price: 8, status: 'Active', color: 'bg-orange-500' },
    { id: 2, name: 'Monthly', duration: '30 Days', price: 18, status: 'Active', color: 'bg-orange-600' },
    { id: 3, name: 'Yearly', duration: '365 Days', price: 28, status: 'Active', color: 'bg-orange-500' },
    { id: 4, name: 'Eid Special', duration: '24 Hours', price: 38, status: 'Active', color: 'bg-orange-500' },
    { id: 5, name: 'Christmas Special', duration: '2 days', price: 48, status: 'Inactive', color: 'bg-orange-200' },
]

const dummyEarnings: UserEarning[] = [
    { id: 1, user: 'Mingulu Marma', email: 'mingulu@gmail.com', subscription: 'Monthly', totalSpent: 550, purchaseDate: '12-08-2025', status: 'Active' },
    { id: 2, user: 'Mingulu Marma', email: 'mingulu@gmail.com', subscription: 'Monthly', totalSpent: 550, purchaseDate: '12-08-2025', status: 'Active' },
    { id: 3, user: 'Mingulu Marma', email: 'mingulu@gmail.com', subscription: 'Monthly', totalSpent: 550, purchaseDate: '12-08-2025', status: 'Active' },
]

export default function SubscriptionClient() {
    const [searchQuery, setSearchQuery] = useState('')
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

    return (
        <div className="space-y-6">
            {/* Top Section: Search & Add Plan */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative w-full sm:w-2/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="search plans"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-white"
                    />
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-[#00A4EF] hover:bg-[#0090d1] text-white h-12 px-6"
                >
                    <Plus className="w-5 h-5 mr-2" /> Add Plan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: All Subscription Plans */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">All subscription plans</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b bg-gray-50/50">
                                        <tr>
                                            <th className="text-left p-4 font-medium text-gray-500">Plan name</th>
                                            <th className="text-center p-4 font-medium text-gray-500">Duration</th>
                                            <th className="text-center p-4 font-medium text-gray-500">Price</th>
                                            <th className="text-center p-4 font-medium text-gray-500">Status</th>
                                            <th className="text-right p-4 font-medium text-gray-500 pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dummyPlans.map((plan) => (
                                            <tr key={plan.id} className="border-b hover:bg-gray-50/50">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded ${plan.color}`}></div>
                                                        <span className={`font-medium ${plan.status === 'Inactive' ? 'text-gray-400' : 'text-gray-900'}`}>{plan.name}</span>
                                                    </div>
                                                </td>
                                                <td className={`p-4 text-center ${plan.status === 'Inactive' ? 'text-gray-400' : ''}`}>{plan.duration}</td>
                                                <td className={`p-4 text-center ${plan.status === 'Inactive' ? 'text-gray-400' : ''}`}>${plan.price}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${plan.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}>
                                                        {plan.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right pr-8">
                                                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-500">
                                                        <Trash2 className="w-5 h-5" />
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

                {/* Right Column: Most Popular Plan */}
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-bold text-center">Most popular plan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-6">
                            {/* Top Plan */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-lg">Chosen by almost all long-term users</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Most subscribers rely on this plan for long-term access.
                                    It consistently drives the highest adoption rate.
                                </p>
                                <div className="text-center py-2">
                                    <span className="text-xl font-bold">Lifetime</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>98% of total subscriber</span>
                                    </div>
                                    <Progress value={98} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />
                                </div>
                            </div>

                            {/* Second Plan */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-lg">Second most selected plan</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                    Users prefer this plan for quick and short-term needs.
                                    It remains the second most chosen option.
                                </p>
                                <div className="text-center py-2">
                                    <span className="text-xl font-bold">10 days</span>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span>88% of total subscriber</span>
                                    </div>
                                    <Progress value={88} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Bottom Section: User-wise earnings */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl font-bold">User-wise earnings</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b bg-gray-50/50">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-500">User</th>
                                    <th className="text-left p-4 font-medium text-gray-500">Email</th>
                                    <th className="text-center p-4 font-medium text-gray-500">Subscription</th>
                                    <th className="text-center p-4 font-medium text-gray-500">Total spent</th>
                                    <th className="text-center p-4 font-medium text-gray-500">Purchase date</th>
                                    <th className="text-center p-4 font-medium text-gray-500">Status</th>
                                    <th className="text-right p-4 font-medium text-gray-500 pr-8">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dummyEarnings.map((earning) => (
                                    <tr key={earning.id} className="border-b hover:bg-gray-50/50">
                                        <td className="p-4 font-medium">{earning.user}</td>
                                        <td className="p-4">{earning.email}</td>
                                        <td className="p-4 text-center">{earning.subscription}</td>
                                        <td className="p-4 text-center">${earning.totalSpent}</td>
                                        <td className="p-4 text-center">{earning.purchaseDate}</td>
                                        <td className="p-4 text-center">
                                            <span className="px-3 py-1 rounded-full text-xs font-medium text-white bg-green-500">
                                                {earning.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right pr-8">
                                            <Button
                                                variant="outline"
                                                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 px-4 h-9"
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

            {/* Add Plan Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-center py-4">Add new subscription plan</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="planName" className="text-base font-normal text-gray-600">Plan name</Label>
                            <Input id="planName" placeholder="1 hour plan" className="h-12" />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-normal text-gray-600">Duration</Label>
                            <div className="flex gap-4 items-end">
                                <div className="flex-1 space-y-1">
                                    <span className="text-xs text-gray-500">Day</span>
                                    <Input type="number" placeholder="0" className="h-12" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <span className="text-xs text-gray-500">Hour</span>
                                    <Input type="number" placeholder="0" className="h-12" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <span className="text-xs text-gray-500">Minute</span>
                                    <Input type="number" placeholder="0" className="h-12" />
                                </div>
                                <div className="flex-[1.5] h-12 border rounded-md flex items-center px-3 justify-between">
                                    <span className="font-medium">Lifetime</span>
                                    <Checkbox className="h-5 w-5 border-orange-400 data-[state=checked]:bg-orange-400 data-[state=checked]:text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-normal text-gray-600">Price</Label>
                            <div className="flex gap-0">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                    <Input type="number" placeholder="8" className="pl-8 h-12 rounded-r-none border-r-0" />
                                </div>
                                <Select defaultValue="dollar">
                                    <SelectTrigger className="w-[120px] h-12 rounded-l-none bg-gray-50">
                                        <SelectValue placeholder="Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dollar">Doller</SelectItem>
                                        <SelectItem value="euro">Euro</SelectItem>
                                        <SelectItem value="taka">Taka</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-normal text-gray-600">Schedule (Optional)</Label>
                            <div className="relative">
                                <Input placeholder="mm/dd/yyyy" className="h-12 pr-10" />
                                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="h-11 px-8">Cancel</Button>
                        <Button className="bg-[#00A4EF] hover:bg-[#0090d1] text-white h-11 px-8" onClick={() => setIsAddDialogOpen(false)}>Activate</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
