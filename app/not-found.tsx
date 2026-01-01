import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center">

                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-blue-600 to-blue-800">
                        404
                    </h1>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
                    {/* Heading */}
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                        Page Not Found
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 text-base md:text-lg mb-8 max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* Primary Button */}
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white font-semibold bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg shadow-blue-500/30 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Home className="w-5 h-5" />
                            <span>Back to Home</span>
                        </Link>

                        {/* Secondary Button */}
                        <Link
                            href="/sign-in"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-gray-700 font-semibold bg-white rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Go to Sign In</span>
                        </Link>
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-sm text-gray-500">
                    Need help?{' '}
                    <Link
                        href="/contact"
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                    >
                        Contact Support
                    </Link>
                </p>
            </div>
        </div>
    )
}