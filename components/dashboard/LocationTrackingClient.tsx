'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Wifi, WifiOff, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { api, formatApiError } from '@/lib/api-client'

// ============================================
// CONFIGURATION
// ============================================
const POLLING_CONFIG = {
    SEND_INTERVAL_MS: 60000,  // 60 seconds for testing, 120000 for production
}
// ============================================

type TrackingStatus = 'idle' | 'connecting' | 'connected' | 'error'

export default function SimpleLocationTracker() {
    const [status, setStatus] = useState<TrackingStatus>('idle')
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null)
    const [sentCount, setSentCount] = useState<number>(0)
    const [lastSentTime, setLastSentTime] = useState<Date | null>(null)
    const [errorMessage, setErrorMessage] = useState<string>('')

    const sendIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const watchIdRef = useRef<number | null>(null)
    const heartbeatRef = useRef<boolean>(false)
    const positionRef = useRef<GeolocationPosition | null>(null)

    // Keep position in sync with ref for interval access
    useEffect(() => {
        positionRef.current = currentPosition
        console.log('📍 Position updated in ref:', currentPosition?.coords.latitude, currentPosition?.coords.longitude)
    }, [currentPosition])

    // Watch Position
    const startWatchingPosition = () => {
        if (watchIdRef.current !== null) return

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                console.log('📍 GPS Position:', position.coords.latitude, position.coords.longitude)
                setCurrentPosition(position)

                // First position received - change from connecting to connected
                if (status === 'connecting') {
                    setStatus('connected')
                    toast.success('Connected! Location tracking active')
                }
            },
            (error) => {
                console.error('❌ GPS Error:', error.message)
                setStatus('error')
                setErrorMessage(error.message)
                toast.error('GPS Error: ' + error.message)
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        )
    }

    const stopWatchingPosition = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }
    }

    // Send Location
    const sendLocation = async (position: GeolocationPosition) => {
        try {
            const locationData = {
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString()
            }

            console.log('📤 POST /employee/location-tracking/track/')
            console.log('📤 Sending location:', JSON.stringify(locationData, null, 2))
            console.log('📤 Time:', new Date().toLocaleTimeString())

            // Trigger heartbeat animation
            heartbeatRef.current = true
            setTimeout(() => {
                heartbeatRef.current = false
            }, 300)

            const response = await api.post('/employee/location-tracking/track/', locationData)

            setSentCount(prev => prev + 1)
            setLastSentTime(new Date())

            console.log('✅ Location sent successfully at', new Date().toLocaleTimeString())
            console.log('✅ Response:', response)
        } catch (error) {
            console.error('❌ Send error:', error)
            toast.error('Failed to send location', {
                description: formatApiError(error)
            })
        }
    }

    // Start Tracking
    const startTracking = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation not supported by your browser')
            return
        }

        setStatus('connecting')
        setErrorMessage('')
        setSentCount(0)
        setLastSentTime(null)

        console.log('🚀 Starting location tracking...')
        console.log('⚙️ Polling interval:', POLLING_CONFIG.SEND_INTERVAL_MS, 'ms')
        toast.info('Acquiring GPS signal...')

        // Request permission and start watching
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                })
            })

            console.log('✅ Initial position acquired:', position.coords.latitude, position.coords.longitude)
            setCurrentPosition(position)
            setStatus('connected')
            toast.success('Connected! Location tracking active')

            // Send immediately
            console.log('📍 Sending initial location immediately...')
            await sendLocation(position)

            // Start watching for updates
            startWatchingPosition()

            // Setup interval - CRITICAL: Use the position from closure or state
            console.log(`⏰ Setting up interval to send every ${POLLING_CONFIG.SEND_INTERVAL_MS}ms`)
            let intervalCount = 0
            sendIntervalRef.current = setInterval(() => {
                intervalCount++
                console.log(`⏰ Interval #${intervalCount} triggered at ${new Date().toLocaleTimeString()}`)

                // Use ref to get latest position (avoids stale closure)
                const latestPosition = positionRef.current
                if (latestPosition) {
                    console.log('📍 Sending location from interval...')
                    sendLocation(latestPosition)
                } else {
                    console.log('⚠️ No position available yet, skipping this interval')
                }
            }, POLLING_CONFIG.SEND_INTERVAL_MS)

            console.log('✅ Interval created with ID:', sendIntervalRef.current)

        } catch (error: any) {
            console.error('❌ Permission error:', error)
            setStatus('error')

            if (error.code === 1) {
                setErrorMessage('Location permission denied')
                toast.error('Please enable location access in browser settings')
            } else if (error.code === 2) {
                setErrorMessage('Location unavailable')
                toast.error('Location unavailable')
            } else if (error.code === 3) {
                setErrorMessage('Location request timeout')
                toast.error('Location request timeout')
            } else {
                setErrorMessage('Failed to get location')
                toast.error('Failed to get location')
            }
        }
    }

    // Stop Tracking
    const stopTracking = () => {
        console.log('⏹️ Stopping location tracking...')

        setStatus('idle')
        stopWatchingPosition()

        if (sendIntervalRef.current) {
            clearInterval(sendIntervalRef.current)
            sendIntervalRef.current = null
        }

        toast.info('Location tracking stopped')
    }

    // Cleanup
    useEffect(() => {
        return () => {
            stopTracking()
        }
    }, [])

    // Status configurations
    const statusConfig = {
        idle: {
            color: 'gray',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-300',
            icon: <WifiOff className="h-8 w-8" />,
            title: 'Location Tracking',
            subtitle: 'Click start to begin tracking',
            pulseColor: 'bg-gray-400'
        },
        connecting: {
            color: 'yellow',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-300',
            icon: <Wifi className="h-8 w-8 animate-pulse" />,
            title: 'Connecting...',
            subtitle: 'Acquiring GPS signal',
            pulseColor: 'bg-yellow-500'
        },
        connected: {
            color: 'green',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            borderColor: 'border-green-300',
            icon: <Wifi className="h-8 w-8" />,
            title: 'Connected',
            subtitle: 'Location tracking active',
            pulseColor: 'bg-green-500'
        },
        error: {
            color: 'red',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
            borderColor: 'border-red-300',
            icon: <WifiOff className="h-8 w-8" />,
            title: 'Error',
            subtitle: errorMessage || 'Something went wrong',
            pulseColor: 'bg-red-500'
        }
    }

    const config = statusConfig[status]

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-2xl space-y-6">
                {/* Config Info */}
                {/* <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Polling Rate</span>
                            <span className="font-semibold text-gray-900">
                                Every {POLLING_CONFIG.SEND_INTERVAL_MS / 1000} seconds
                            </span>
                        </div>
                    </CardContent>
                </Card> */}

                {/* Main Status Card */}
                <Card className={`${config.bgColor} border-2 ${config.borderColor} shadow-sm overflow-hidden`}>
                    <CardContent className="p-12">
                        <div className="flex flex-col items-center text-center space-y-8">
                            {/* Icon with pulse rings */}
                            <div className="relative">
                                {/* Animated pulse rings */}
                                {status === 'connected' && (
                                    <>
                                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-20 animate-ping"></div>
                                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-10 animate-ping" style={{ animationDelay: '0.3s' }}></div>
                                        <div className="absolute inset-0 rounded-full bg-green-400 opacity-5 animate-ping" style={{ animationDelay: '0.6s' }}></div>
                                    </>
                                )}

                                {status === 'connecting' && (
                                    <>
                                        <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-20 animate-ping"></div>
                                        <div className="absolute inset-0 rounded-full bg-yellow-400 opacity-10 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                                    </>
                                )}

                                {/* Icon container with heartbeat */}
                                <div
                                    className={`relative p-8 ${config.bgColor} rounded-full ${config.textColor} shadow-lg transition-transform ${status === 'connected' ? 'animate-pulse' : ''
                                        }`}
                                >
                                    {config.icon}
                                </div>

                                {/* Heartbeat indicator */}
                                {status === 'connected' && (
                                    <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                                        <Activity className="h-5 w-5 text-green-500 animate-pulse" />
                                    </div>
                                )}
                            </div>

                            {/* Status Text */}
                            <div className="space-y-2">
                                <h2 className={`text-4xl font-bold ${config.textColor}`}>
                                    {config.title}
                                </h2>
                                <p className={`text-lg ${config.textColor} opacity-80`}>
                                    {config.subtitle}
                                </p>
                            </div>

                            {/* Stats */}
                            {status === 'connected' && (
                                <div className="w-full grid grid-cols-2 gap-4 pt-4">
                                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                                        <div className="text-xs text-gray-600 mb-1">Locations Sent</div>
                                        <div className="text-3xl font-bold text-gray-900">{sentCount}</div>
                                    </div>
                                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
                                        <div className="text-xs text-gray-600 mb-1">Last Sent</div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {lastSentTime ? lastSentTime.toLocaleTimeString() : '--'}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Current Position */}
                            {status === 'connected' && currentPosition && (
                                <div className="w-full bg-white/50 backdrop-blur-sm rounded-xl p-4 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Latitude</span>
                                        <span className="font-mono font-semibold text-gray-900">
                                            {currentPosition.coords.latitude.toFixed(6)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Longitude</span>
                                        <span className="font-mono font-semibold text-gray-900">
                                            {currentPosition.coords.longitude.toFixed(6)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Accuracy</span>
                                        <span className="font-mono font-semibold text-gray-900">
                                            ±{currentPosition.coords.accuracy.toFixed(1)}m
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="pt-4 w-full">
                                {status === 'idle' || status === 'error' ? (
                                    <Button
                                        onClick={startTracking}
                                        className="w-full h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-[#007BF3] to-[#00A4EF] hover:shadow-2xl hover:shadow-blue-200 text-white transition-all duration-300 transform hover:scale-105"
                                    >
                                        <MapPin className="mr-3 h-6 w-6" />
                                        Start Tracking
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={stopTracking}
                                        variant="outline"
                                        className="w-full h-16 text-xl font-bold rounded-2xl border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all duration-300"
                                    >
                                        Stop Tracking
                                    </Button>
                                )}
                            </div>

                            {/* Status indicator dots */}
                            <div className="flex items-center gap-3 pt-2">
                                <div className={`h-3 w-3 rounded-full ${status === 'idle' ? 'bg-gray-400' :
                                    status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                                        status === 'connected' ? 'bg-green-500 animate-pulse' :
                                            'bg-red-500'
                                    }`}></div>
                                <span className="text-sm text-gray-600 font-medium">
                                    {status === 'idle' && 'Ready to start'}
                                    {status === 'connecting' && 'Connecting to GPS...'}
                                    {status === 'connected' && 'Sending location automatically'}
                                    {status === 'error' && 'Connection failed'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-white/60 backdrop-blur-sm border-none shadow-sm">
                    <CardContent className="p-6">
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-blue-600 font-bold text-xs">1</span>
                                </div>
                                <p>Click "Start Tracking" to begin sending your location</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-blue-600 font-bold text-xs">2</span>
                                </div>
                                <p>Your browser will ask for location permission - please allow it</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-blue-600 font-bold text-xs">3</span>
                                </div>
                                <p>Your location will be sent automatically </p>
                                {/* every {POLLING_CONFIG.SEND_INTERVAL_MS / 1000} seconds */}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}