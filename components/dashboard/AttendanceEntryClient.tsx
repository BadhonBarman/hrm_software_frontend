'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarIcon, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
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
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Mark Your Attendance</h2>
                            <p className="text-sm text-gray-600">Punch in or out with your current location</p>
                        </div>
                    </div>
                    <Button
                        onClick={handlePunch}
                        disabled={punchLoading || timeLeft > 0}
                        className={cn(
                            "min-w-[140px] h-11 font-medium transition-all",
                            timeLeft > 0
                                ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-100"
                                : "bg-[#00A4EF] hover:bg-[#0090d1] text-white shadow-md hover:shadow-lg"
                        )}
                        variant={timeLeft > 0 ? "outline" : "default"}
                    >
                        {punchLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
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
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-700">{stats.present}</div>
                        <div className="text-xs font-medium text-green-600 uppercase tracking-wider mt-1">Present</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-700">{stats.absent}</div>
                        <div className="text-xs font-medium text-red-600 uppercase tracking-wider mt-1">Absent</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-700">{stats.late}</div>
                        <div className="text-xs font-medium text-yellow-600 uppercase tracking-wider mt-1">Late</div>
                    </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-gray-700">{stats.offDay}</div>
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wider mt-1">Off Day</div>
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-700">{stats.holiday}</div>
                        <div className="text-xs font-medium text-purple-600 uppercase tracking-wider mt-1">Holiday</div>
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
            <Card>
                <CardContent className="p-0">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 border-b bg-gray-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="py-3 text-center text-sm font-medium text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Body */}
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading calendar...</div>
                    ) : (
                        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px border-b border-gray-200">
                            {/* Empty cells for start of month */}
                            {emptyDays.map((_, i) => (
                                <div key={`empty-${i}`} className="bg-white min-h-[120px] p-2" />
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
                                            "bg-white min-h-[120px] p-3 flex flex-col gap-2 transition-colors hover:bg-gray-50",
                                            isTodayDate && "bg-blue-50/30"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={cn(
                                                "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full",
                                                isTodayDate ? "bg-blue-600 text-white" : "text-gray-700"
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            {displayStatus && (
                                                <span className={cn(
                                                    "text-[10px] px-2 py-0.5 rounded-full font-medium border uppercase tracking-wider",
                                                    displayStatus === 'Late' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                                        displayStatus === 'present' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            displayStatus === 'absent' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                'bg-gray-100 text-gray-600 border-gray-200'
                                                )}>
                                                    {displayStatus}
                                                </span>
                                            )}
                                        </div>

                                        {data && (
                                            <div className="mt-auto space-y-1">
                                                {data.punch_in && (
                                                    <div className="text-xs text-gray-600 flex justify-between">
                                                        <span>In:</span>
                                                        <span className="font-medium">{format(new Date(data.punch_in), 'h:mm a')}</span>
                                                    </div>
                                                )}
                                                {data.punch_out && (
                                                    <div className="text-xs text-gray-600 flex justify-between">
                                                        <span>Out:</span>
                                                        <span className="font-medium">{format(new Date(data.punch_out), 'h:mm a')}</span>
                                                    </div>
                                                )}
                                                {data.total_hours && parseFloat(data.total_hours) > 0 && (
                                                    <div className="text-[10px] text-gray-400 text-right pt-1 border-t border-dashed mt-1">
                                                        {data.total_hours} hrs
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {/* Fill remaining cells to complete the grid if needed, 
                                but standard CSS grid handles this fine by leaving empty space or we can fill.
                                Let's leave as is for cleaner code.
                            */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}