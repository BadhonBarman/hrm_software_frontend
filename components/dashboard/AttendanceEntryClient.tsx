'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, ChevronLeft, ChevronRight, MapPin, UserCheck, UserX, Clock, CalendarOff, Palmtree, MoreVertical, UserCheck2Icon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as DatePicker } from '@/components/ui/calendar'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isAfter, isBefore, getDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { api, formatApiError } from '@/lib/api-client'
import { toast } from 'sonner'

interface DailyAttendance {
    id: number
    employee: number
    employee_name: string
    date: string
    date_formatted: string
    punch_in: string | null
    punch_out: string | null
    total_hours: string
    status: string
}

interface DailyAttendanceResponse {
    total_pages: number
    current_page: number
    page_size: number
    count: number
    next: string | null
    previous: string | null
    results: DailyAttendance[]
}

export default function AttendanceEntryClient() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [attendanceData, setAttendanceData] = useState<DailyAttendance[]>([])
    const [loading, setLoading] = useState(false)
    const [punchLoading, setPunchLoading] = useState(false)
    const [timeLeft, setTimeLeft] = useState(0)

    // Fetch monthly attendance when selectedDate changes (specifically the month)
    useEffect(() => {
        if (selectedDate) {
            fetchMonthlyAttendance()
        }
    }, [selectedDate])

    // Check for existing rate limit on mount
    useEffect(() => {
        const lastPunch = localStorage.getItem('lastPunchTime')
        if (lastPunch) {
            const diff = Date.now() - parseInt(lastPunch)
            if (diff < 120000) { // 2 minutes in milliseconds
                setTimeLeft(Math.ceil((120000 - diff) / 1000))
            }
        }
    }, [])

    // Countdown timer
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1)
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [timeLeft])

    const fetchMonthlyAttendance = async () => {
        setLoading(true)
        try {
            const monthStr = format(selectedDate, 'yyyy-MM')
            const response = await api.get<DailyAttendanceResponse>(
                `/employee/attendance/daily/?month=${monthStr}&page_size=31`
            )
            setAttendanceData(response.results)
        } catch (error) {
            toast.error('Failed to load attendance data', {
                description: formatApiError(error)
            })
            setAttendanceData([])
        } finally {
            setLoading(false)
        }
    }

    const handlePunch = () => {
        if (timeLeft > 0) return
        setPunchLoading(true)

        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported by your browser')
            setPunchLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords
                    await api.post('/employee/attendance/punch/', {
                        location: `${latitude},${longitude}`
                    })
                    toast.success('Thank you! Attendance marked successfully')

                    // Set rate limit
                    const now = Date.now()
                    localStorage.setItem('lastPunchTime', now.toString())
                    setTimeLeft(120)

                    // Refresh data
                    fetchMonthlyAttendance()
                } catch (error) {
                    toast.error(formatApiError(error))
                } finally {
                    setPunchLoading(false)
                }
            },
            (error) => {
                console.error(error)
                toast.error('Please allow location access to mark attendance')
                setPunchLoading(false)
            }
        )
    }

    // Calendar Logic
    const monthStart = startOfMonth(selectedDate)
    const monthEnd = endOfMonth(monthStart)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Fill in empty days at start of month for grid alignment
    const startDayOfWeek = getDay(monthStart) // 0 (Sunday) to 6 (Saturday)
    // Adjust to make Monday first day if needed, but standard US calendar is Sunday first. 
    // Let's stick to standard Sunday start for simplicity or adjust based on preference.
    // Assuming Sunday start for now.
    const emptyDays = Array.from({ length: startDayOfWeek })

    const getDayData = (day: Date) => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return attendanceData.find(d => d.date === dateStr)
    }

    const getStatusColor = (status: string | undefined, isLate: boolean) => {
        if (isLate) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        switch (status) {
            case 'present': return 'bg-green-100 text-green-700 border-green-200'
            case 'absent': return 'bg-red-100 text-red-700 border-red-200'
            case 'leave': return 'bg-blue-100 text-blue-700 border-blue-200'
            default: return 'bg-gray-50 text-gray-500 border-gray-100'
        }
    }

    const isLate = (punchIn: string | null) => {
        if (!punchIn) return false
        const date = new Date(punchIn)
        const hours = date.getHours()
        const minutes = date.getMinutes()
        // Late if after 9:00 AM
        return hours > 9 || (hours === 9 && minutes > 0)
    }

    // Stats Calculation
    const stats = {
        present: 0,
        absent: 0,
        late: 0,
        offDay: 0,
        holiday: 0
    }

    calendarDays.forEach((day) => {
        if (isAfter(day, new Date())) return // Skip future dates

        const data = getDayData(day)
        const dayOfWeek = getDay(day)
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sun or Sat

        if (data) {
            if (data.status === 'present') {
                stats.present++
                if (isLate(data.punch_in)) stats.late++
            } else if (data.status === 'absent') {
                stats.absent++
            } else if (data.status === 'leave') {
                // stats.leave++
            } else if (data.status === 'holiday') {
                stats.holiday++
            } else if (data.status === 'off_day') {
                stats.offDay++
            }
        } else {
            // No data
            if (isWeekend) {
                stats.offDay++
            } else if (isBefore(day, new Date()) && !isToday(day)) {
                stats.absent++
            }
        }
    })

    return (
        <div className="space-y-6">
            {/* Employee Punch Section */}
            <Card className="bg-white/50 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-50"></div>
                <CardContent className="p-8 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg text-blue-400 ring-4 ring-blue-50">
                            <UserCheck2Icon size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Mark Attendance</h2>
                            <p className="text-gray-500 mt-1">Punch in or out securely with your location</p>
                        </div>
                    </div>
                    <Button
                        onClick={handlePunch}
                        disabled={punchLoading || timeLeft > 0}
                        className={cn(
                            "min-w-[160px] cursor-pointer h-12 text-base font-semibold rounded-full transition-all duration-300 transform hover:scale-105",
                            timeLeft > 0
                                ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100"
                                : "bg-gradient-to-r from-[#007BF3] to-[#00A4EF] hover:shadow-blue-200 hover:shadow-sm text-white border-none"
                        )}
                        variant={timeLeft > 0 ? "outline" : "default"}
                    >
                        {punchLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                                Processing...
                            </span>
                        ) : timeLeft > 0 ? (
                            `Wait ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                        ) : (
                            'Punch In/Out'
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Present</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.present}</h3>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                <UserCheck size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Absent</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.absent}</h3>
                            </div>
                            <div className="p-3 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-100 transition-colors">
                                <UserX size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Late</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.late}</h3>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                                <Clock size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Off Day</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.offDay}</h3>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl text-slate-600 group-hover:bg-slate-100 transition-colors">
                                <CalendarOff size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Holiday</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.holiday}</h3>
                            </div>
                            <div className="p-3 bg-violet-50 rounded-xl text-violet-600 group-hover:bg-violet-100 transition-colors">
                                <Palmtree size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Controls */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">
                    {format(selectedDate, 'MMMM yyyy')}
                </h2>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-[240px] justify-start text-left font-normal',
                                    !selectedDate && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'PPP') : <span>Select date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <DatePicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => date && setSelectedDate(date)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="py-4 text-center text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Body */}
                    {loading ? (
                        <div className="p-20 text-center text-gray-500 flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <p>Loading calendar...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 auto-rows-fr bg-gray-50/30 gap-px border-b border-gray-100">
                            {/* Empty cells for start of month */}
                            {emptyDays.map((_, i) => (
                                <div key={`empty-${i}`} className="bg-white/40 min-h-[140px] p-2" />
                            ))}

                            {/* Actual days */}
                            {calendarDays.map((day) => {
                                const data = getDayData(day)
                                const isTodayDate = isToday(day)
                                const isFutureDate = isAfter(day, new Date())
                                const isPastDate = isBefore(day, new Date()) && !isTodayDate

                                const late = isLate(data?.punch_in || null)
                                const status = data?.status

                                // Determine display status
                                let displayStatus = status
                                if (late && status === 'present') displayStatus = 'Late'
                                else if (!data && isPastDate && getDay(day) !== 0 && getDay(day) !== 6) displayStatus = 'Absent' // Assume absent if no data on weekdays in past
                                else if (!data) displayStatus = ''

                                // Override for future
                                if (isFutureDate) displayStatus = ''

                                return (
                                    <div
                                        key={day.toString()}
                                        className={cn(
                                            "bg-white min-h-[140px] p-4 flex flex-col gap-3 transition-all duration-200 hover:bg-blue-50/30 group relative border-b border-r border-gray-50 last:border-r-0",
                                            isTodayDate && "bg-blue-50/20"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "text-sm font-semibold h-8 w-8 flex items-center justify-center rounded-full transition-colors",
                                                isTodayDate ? "bg-[#007BF3] text-white shadow-md shadow-blue-200" : "text-gray-700 group-hover:bg-gray-100"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            {displayStatus && (
                                                <span className={cn(
                                                    "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm",
                                                    displayStatus === 'Late' ? 'bg-amber-100 text-amber-700' :
                                                        displayStatus === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                            displayStatus === 'absent' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-slate-100 text-slate-600'
                                                )}>
                                                    {displayStatus}
                                                </span>
                                            )}
                                        </div>

                                        {data && (
                                            <div className="mt-auto space-y-1.5">
                                                {data.punch_in && (
                                                    <div className="text-xs text-gray-600 flex justify-between items-center bg-gray-50/50 p-1.5 rounded-md">
                                                        <span className="text-gray-400">In</span>
                                                        <span className="font-semibold text-gray-700">{format(new Date(data.punch_in), 'h:mm a')}</span>
                                                    </div>
                                                )}
                                                {data.punch_out && (
                                                    <div className="text-xs text-gray-600 flex justify-between items-center bg-gray-50/50 p-1.5 rounded-md">
                                                        <span className="text-gray-400">Out</span>
                                                        <span className="font-semibold text-gray-700">{format(new Date(data.punch_out), 'h:mm a')}</span>
                                                    </div>
                                                )}
                                                {data.total_hours && parseFloat(data.total_hours) > 0 && (
                                                    <div className="text-[10px] text-gray-400 text-right pt-1.5 px-1">
                                                        {data.total_hours} hrs
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}