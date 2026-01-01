'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Clock, Activity, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { api, formatApiError } from '@/lib/api-client'

// ============================================
// CONFIGURATION - Adjust polling rates here
// ============================================
const POLLING_CONFIG = {
    SEND_INTERVAL_MS: 2000,      // How often to send location (2 seconds for testing, 120000 for production)
    FETCH_INTERVAL_MS: 2000,     // How often to fetch route data (2 seconds for testing, 120000 for production)
    RATE_LIMIT_MS: 2000,         // Minimum time between sends (2 seconds for testing, 120000 for production)
}
// ============================================

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom Icons
const currentLocationIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

const routePointIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [20, 33],
    iconAnchor: [10, 33],
    popupAnchor: [1, -28],
    shadowSize: [33, 33]
})

// Types
interface LocationData {
    id?: number
    employee: number
    employee_name?: string
    latitude: string
    longitude: string
    accuracy?: number | null
    timestamp?: string
    date?: string
    address?: string | null
    speed?: number | null
    battery_level?: number | null
}

interface RouteResponse {
    employee_name: string
    locations: LocationData[]
    stats?: {
        total_points: number
        start_time: string
        end_time: string
        total_distance_meters: number
        total_distance_km: number
    }
}

// Map Auto-Center Component
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap()
    useEffect(() => {
        map.setView(center, zoom)
    }, [center, zoom, map])
    return null
}

export default function LocationTrackingClient() {
    // Location states
    const [currentPosition, setCurrentPosition] = useState<GeolocationPosition | null>(null)
    const [locationPermission, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt')
    const [locationError, setLocationError] = useState<string>('')

    // Map states
    const [mapCenter, setMapCenter] = useState<[number, number]>([23.8103, 90.4125]) // Dhaka default
    const [mapZoom, setMapZoom] = useState<number>(13)
    const [routeData, setRouteData] = useState<RouteResponse | null>(null)
    const [isTracking, setIsTracking] = useState<boolean>(false)
    const [isSending, setIsSending] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    // Stats
    const [lastSentTime, setLastSentTime] = useState<Date | null>(null)
    const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null)
    const [sentCount, setSentCount] = useState<number>(0)
    const [fetchCount, setFetchCount] = useState<number>(0)
    const [timeLeft, setTimeLeft] = useState<number>(0)

    // Refs for intervals
    const sendIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const watchIdRef = useRef<number | null>(null)

    // Check for rate limit on mount
    useEffect(() => {
        const lastTrack = localStorage.getItem('lastLocationTrackTime')
        if (lastTrack) {
            const diff = Date.now() - parseInt(lastTrack)
            if (diff < POLLING_CONFIG.RATE_LIMIT_MS) {
                setTimeLeft(Math.ceil((POLLING_CONFIG.RATE_LIMIT_MS - diff) / 1000))
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

    // Request Location Permission
    const requestLocationPermission = async () => {
        try {
            if (!navigator.geolocation) {
                setLocationError('Geolocation is not supported by your browser')
                toast.error('Geolocation not supported')
                return false
            }

            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                })
            })

            setCurrentPosition(position)
            setLocationPermission('granted')
            setMapCenter([position.coords.latitude, position.coords.longitude])
            setMapZoom(15)
            setLocationError('')
            toast.success('Location permission granted')
            return true
        } catch (error: any) {
            if (error.code === 1) {
                setLocationPermission('denied')
                setLocationError('Location permission denied')
                toast.error('Please enable location access in your browser settings')
            } else if (error.code === 2) {
                setLocationError('Location unavailable')
                toast.error('Location unavailable. Please check your device settings.')
            } else if (error.code === 3) {
                setLocationError('Location request timed out')
                toast.error('Location request timed out. Please try again.')
            } else {
                setLocationError('Failed to get location')
                toast.error('Failed to get location')
            }
            return false
        }
    }

    // Watch Position Continuously
    const startWatchingPosition = () => {
        if (watchIdRef.current !== null) {
            console.log('⚠️ Watch already active')
            return
        }

        console.log('👀 Starting position watch...')
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                console.log('📍 Position updated from GPS:')
                console.log('  - Latitude:', position.coords.latitude)
                console.log('  - Longitude:', position.coords.longitude)
                console.log('  - Accuracy:', position.coords.accuracy, 'm')
                console.log('  - Timestamp:', new Date(position.timestamp).toLocaleTimeString())

                setCurrentPosition(position)
                setLocationError('')

                // Auto-send on first position if tracking just started
                if (!currentPosition && isTracking && timeLeft === 0) {
                    console.log('🎯 First position received! Auto-sending...')
                    sendLocationToAPI(position)
                }
            },
            (error) => {
                console.error('❌ Watch position error:', error)
                console.error('  - Code:', error.code)
                console.error('  - Message:', error.message)
                setLocationError('Error tracking location')
            },
            {
                enableHighAccuracy: true,
                timeout: 30000,
                maximumAge: 0
            }
        )
        console.log('✅ Position watch started with ID:', watchIdRef.current)
    }

    const stopWatchingPosition = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }
    }

    // Send Location to API
    const sendLocationToAPI = async (position: GeolocationPosition) => {
        if (isSending || timeLeft > 0) {
            console.log('⏸️ Skipping send - isSending:', isSending, 'timeLeft:', timeLeft)
            return
        }

        setIsSending(true)
        try {
            // Prepare location data - matching your Django API format exactly
            const locationData = {
                latitude: position.coords.latitude.toString(),
                longitude: position.coords.longitude.toString()
            }

            console.log('📍 POST /employee/location-tracking/track/')
            console.log('📤 Request body:', JSON.stringify(locationData, null, 2))

            const response = await api.post('/employee/location-tracking/track/', locationData)

            console.log('✅ Response:', JSON.stringify(response, null, 2))

            setLastSentTime(new Date())
            setSentCount(prev => prev + 1)

            // Set rate limit
            const now = Date.now()
            localStorage.setItem('lastLocationTrackTime', now.toString())
            setTimeLeft(Math.ceil(POLLING_CONFIG.RATE_LIMIT_MS / 1000))

            toast.success('Location sent successfully', {
                description: `Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`
            })

            // Fetch updated route data immediately after successful send
            setTimeout(() => {
                fetchRouteData()
            }, 500)
        } catch (error) {
            console.error('❌ Error sending location:', error)
            console.error('❌ Full error object:', JSON.stringify(error, null, 2))
            toast.error('Failed to send location', {
                description: formatApiError(error)
            })
        } finally {
            setIsSending(false)
        }
    }

    // Fetch Route Data
    const fetchRouteData = async () => {
        setLoading(true)
        try {
            // Get today's date in YYYY-MM-DD format
            const today = new Date()
            const year = today.getFullYear()
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const day = String(today.getDate()).padStart(2, '0')
            const todayFormatted = `${year}-${month}-${day}`

            console.log('📥 GET /employee/location-tracking/route/')
            console.log('📅 Today date:', todayFormatted)
            console.log('🌐 Full URL:', `/employee/location-tracking/route/?date=${todayFormatted}`)

            const response = await api.get<RouteResponse>(
                `/employee/location-tracking/route/?date=${todayFormatted}`
            )

            console.log('✅ Route response received:', JSON.stringify(response, null, 2))
            console.log('📊 Total locations:', response.locations?.length || 0)
            console.log('📈 Stats:', response.stats)

            setRouteData(response)
            setLastFetchTime(new Date())
            setFetchCount(prev => prev + 1)

            // Update map center to latest location
            if (response.locations && response.locations.length > 0) {
                const latest = response.locations[0]
                console.log('📍 Latest location:', latest)
                if (latest.latitude && latest.longitude) {
                    const lat = parseFloat(latest.latitude)
                    const lng = parseFloat(latest.longitude)
                    if (!isNaN(lat) && !isNaN(lng)) {
                        console.log('🗺️ Updating map center to:', { lat, lng })
                        setMapCenter([lat, lng])
                        setMapZoom(15)
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error fetching route:', error)
            console.error('❌ Full error object:', JSON.stringify(error, null, 2))
            toast.error('Failed to fetch route data', {
                description: formatApiError(error)
            })
        } finally {
            setLoading(false)
        }
    }

    // Start Tracking
    const startTracking = async () => {
        const hasPermission = locationPermission === 'granted' || await requestLocationPermission()

        if (!hasPermission) {
            console.log('❌ Location permission not granted')
            return
        }

        console.log('🚀 Starting location tracking...')
        console.log('⚙️ Configuration:', POLLING_CONFIG)

        setIsTracking(true)
        startWatchingPosition()

        // Send location immediately if available
        if (currentPosition) {
            console.log('📍 Sending initial location immediately')
            await sendLocationToAPI(currentPosition)
        } else {
            console.log('⏳ Waiting for initial position from GPS...')
        }

        // Setup intervals using config
        console.log(`⏰ Setting up send interval: every ${POLLING_CONFIG.SEND_INTERVAL_MS}ms`)
        sendIntervalRef.current = setInterval(() => {
            console.log('⏰ Send interval triggered at', new Date().toLocaleTimeString())
            if (currentPosition) {
                sendLocationToAPI(currentPosition)
            } else {
                console.log('⚠️ No current position available, skipping send')
            }
        }, POLLING_CONFIG.SEND_INTERVAL_MS)

        console.log(`⏰ Setting up fetch interval: every ${POLLING_CONFIG.FETCH_INTERVAL_MS}ms`)
        fetchIntervalRef.current = setInterval(() => {
            console.log('⏰ Fetch interval triggered at', new Date().toLocaleTimeString())
            fetchRouteData()
        }, POLLING_CONFIG.FETCH_INTERVAL_MS)

        // Initial fetch
        console.log('📥 Fetching initial route data')
        fetchRouteData()
        toast.success('Location tracking started')
    }

    // Stop Tracking
    const stopTracking = () => {
        setIsTracking(false)
        stopWatchingPosition()

        if (sendIntervalRef.current) {
            clearInterval(sendIntervalRef.current)
            sendIntervalRef.current = null
        }

        if (fetchIntervalRef.current) {
            clearInterval(fetchIntervalRef.current)
            fetchIntervalRef.current = null
        }

        console.log('⏹️ Location tracking stopped')
        toast.info('Location tracking stopped')
    }

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopTracking()
        }
    }, [])

    // Format time
    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    // Route coordinates for polyline
    const routeCoordinates: [number, number][] = routeData?.locations
        ? routeData.locations
            .filter(loc => loc.latitude && loc.longitude)
            .map(loc => {
                const lat = parseFloat(loc.latitude)
                const lng = parseFloat(loc.longitude)
                return [lat, lng] as [number, number]
            })
            .filter(([lat, lng]) => !isNaN(lat) && !isNaN(lng))
            .reverse()
        : []

    return (
        <div className="space-y-6">
            {/* Configuration Info */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-900">Polling Configuration</span>
                        </div>
                        <div className="text-sm text-purple-700">
                            Send: {POLLING_CONFIG.SEND_INTERVAL_MS / 1000}s | Fetch: {POLLING_CONFIG.FETCH_INTERVAL_MS / 1000}s | Rate Limit: {POLLING_CONFIG.RATE_LIMIT_MS / 1000}s
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Control Card */}
            <Card className="bg-white/50 backdrop-blur-md border border-white/20 shadow-sm rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 opacity-50"></div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg text-blue-400 ring-4 ring-blue-50">
                                <MapPin size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Live Location Tracking</h2>
                                <p className="text-gray-500 mt-1">Track your location automatically with real-time updates</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {!isTracking ? (
                                <>
                                    {locationPermission !== 'granted' && (
                                        <Button
                                            onClick={requestLocationPermission}
                                            variant="outline"
                                            className="rounded-full"
                                        >
                                            <Navigation className="mr-2 h-4 w-4" />
                                            Allow Location
                                        </Button>
                                    )}
                                    <Button
                                        onClick={startTracking}
                                        disabled={locationPermission === 'denied'}
                                        className="min-w-[160px] h-12 rounded-full bg-gradient-to-r from-[#007BF3] to-[#00A4EF] hover:shadow-blue-200 hover:shadow-sm text-white font-semibold"
                                    >
                                        <Play className="mr-2 h-5 w-5" />
                                        Start Tracking
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => {
                                            console.log('🔴 Manual Send Button Clicked')
                                            if (currentPosition) {
                                                console.log('📍 Current Position exists:', {
                                                    lat: currentPosition.coords.latitude,
                                                    lng: currentPosition.coords.longitude
                                                })
                                                sendLocationToAPI(currentPosition)
                                            } else {
                                                console.log('❌ No current position available')
                                                toast.error('Waiting for GPS location...')
                                            }
                                        }}
                                        disabled={isSending || timeLeft > 0}
                                        variant="outline"
                                        className="rounded-full border-2 border-green-200 text-green-600 hover:bg-green-50"
                                    >
                                        {isSending ? 'Sending...' : 'Send Now'}
                                    </Button>
                                    <Button
                                        onClick={stopTracking}
                                        variant="outline"
                                        className="min-w-[160px] h-12 rounded-full border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold"
                                    >
                                        <Pause className="mr-2 h-5 w-5" />
                                        Stop Tracking
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Location Error */}
                    {locationError && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
                            {locationError}
                        </div>
                    )}

                    {/* Current Status */}
                    {isTracking && (
                        <div className="mt-6 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Latitude</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {currentPosition ? currentPosition.coords.latitude.toFixed(6) : 'Waiting...'}
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Longitude</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {currentPosition ? currentPosition.coords.longitude.toFixed(6) : 'Waiting...'}
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Next Update</div>
                                    <div className="text-lg font-bold text-gray-900">
                                        {timeLeft > 0 ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}` : 'Ready'}
                                    </div>
                                </div>
                                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-100">
                                    <div className="text-xs text-gray-500 mb-1">Status</div>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${currentPosition ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></div>
                                        <div className="text-lg font-bold text-gray-900">
                                            {currentPosition ? 'GPS Locked' : 'Waiting GPS'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!currentPosition && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl text-sm">
                                    🛰️ Acquiring GPS signal... This may take 10-30 seconds.
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Locations Sent</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{sentCount}</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {lastSentTime ? lastSentTime.toLocaleTimeString() : 'Not sent yet'}
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                <Navigation size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Data Updates</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{fetchCount}</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    {lastFetchTime ? lastFetchTime.toLocaleTimeString() : 'Not fetched yet'}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <Activity size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Points</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                                    {routeData?.stats?.total_points || 0}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Today's route</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                                <MapPin size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur-sm border-none shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Distance</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                                    {routeData?.stats?.total_distance_km?.toFixed(2) || '0.00'}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Kilometers</p>
                            </div>
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                                <Activity size={20} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Employee Name */}
            {routeData?.employee_name && (
                <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                {routeData.employee_name.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tracking</p>
                                <p className="font-semibold text-gray-900">{routeData.employee_name}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Map */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div style={{ height: '600px', width: '100%' }}>
                        {loading && fetchCount === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <p>Loading map...</p>
                            </div>
                        ) : (
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapUpdater center={mapCenter} zoom={mapZoom} />

                                {/* Current Position */}
                                {currentPosition && (
                                    <Marker
                                        position={[currentPosition.coords.latitude, currentPosition.coords.longitude]}
                                        icon={currentLocationIcon}
                                    >
                                        <Popup>
                                            <div className="text-sm space-y-1">
                                                <div className="font-bold text-red-600">Current Position</div>
                                                <div><strong>Lat:</strong> {currentPosition.coords.latitude.toFixed(6)}</div>
                                                <div><strong>Lng:</strong> {currentPosition.coords.longitude.toFixed(6)}</div>
                                                <div><strong>Accuracy:</strong> ±{currentPosition.coords.accuracy.toFixed(1)}m</div>
                                                {currentPosition.coords.speed && (
                                                    <div><strong>Speed:</strong> {(currentPosition.coords.speed * 3.6).toFixed(1)} km/h</div>
                                                )}
                                                <div><strong>Time:</strong> {new Date(currentPosition.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Route Line */}
                                {routeCoordinates.length > 1 && (
                                    <Polyline
                                        positions={routeCoordinates}
                                        color="#3388ff"
                                        weight={4}
                                        opacity={0.7}
                                    />
                                )}

                                {/* Route Points */}
                                {routeData?.locations && routeData.locations.map((location, index) => {
                                    if (!location.latitude || !location.longitude) return null
                                    const lat = parseFloat(location.latitude)
                                    const lng = parseFloat(location.longitude)
                                    if (isNaN(lat) || isNaN(lng)) return null

                                    return (
                                        <Marker
                                            key={location.id || index}
                                            position={[lat, lng]}
                                            icon={index === 0 ? currentLocationIcon : routePointIcon}
                                        >
                                            <Popup>
                                                <div className="text-sm space-y-1">
                                                    <div className="font-bold">{location.employee_name || 'Employee'}</div>
                                                    <div><strong>Point:</strong> {routeData.locations.length - index}</div>
                                                    <div><strong>Time:</strong> {location.timestamp ? formatTime(location.timestamp) : '--'}</div>
                                                    <div><strong>Lat:</strong> {lat.toFixed(6)}</div>
                                                    <div><strong>Lng:</strong> {lng.toFixed(6)}</div>
                                                    {location.accuracy && <div><strong>Accuracy:</strong> ±{location.accuracy.toFixed(1)}m</div>}
                                                    {location.speed && <div><strong>Speed:</strong> {(location.speed * 3.6).toFixed(1)} km/h</div>}
                                                    {location.battery_level && <div><strong>Battery:</strong> {location.battery_level}%</div>}
                                                    {location.address && <div><strong>Address:</strong> {location.address}</div>}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                })}
                            </MapContainer>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}