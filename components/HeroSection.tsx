'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Apple, Play } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const HeroSection = () => {
    return (
        <section className="relative pt-32 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    {/* Main Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl sm:text-6xl leading-24 mt-10 lg:text-7xl font-bold text-gray-900 mb-6"
                    >
                        Designed for Teachers
                        <br />
                        Who Want to Work
                        <br />
                        Smarter.
                    </motion.h1>

                    {/* Subheading */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
                    >
                        Transform your teaching workflow with our all-in-one platform.
                        Manage lessons, track attendance, and analyze student performance effortlessly.
                    </motion.p>

                    {/* App Store Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href={"#"}
                        >
                            <Image
                                src="/icons/app_store.png"
                                alt="App Store"
                                width={193}
                                height={56}
                            />
                        </Link>
                        <Link
                            href={"#"}
                        >
                            <Image
                                src="/icons/g_play.png"
                                alt="Play Store"
                                width={193}
                                height={56}
                            />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default HeroSection
