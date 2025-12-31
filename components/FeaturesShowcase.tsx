'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const FeaturesShowcase = () => {
    const partners = [
        { name: 'Edmodo', color: '#4A90E2' },
        { name: 'Kahoot', color: '#46178F' },
        { name: 'Blackboard', color: '#F7931E' },
        { name: 'Schoology', color: '#2BB673' },
        { name: 'Moodle', color: '#F98012' },
        { name: 'ClassDojo', color: '#4FC1E9' },
    ]

    const countries = [
        { name: 'Barbados', flag: '🇧🇧' },
        { name: 'Benin', flag: '🇧🇯' },
        { name: 'Bolivia', flag: '🇧🇴' },
        { name: 'Guatemala', flag: '🇬🇹' },
        { name: 'Macau', flag: '🇲🇴' },
        { name: 'Luxembourg', flag: '🇱🇺' },
        { name: 'Bangladesh', flag: '🇧🇩' },
        { name: 'India', flag: '🇮🇳' },
        { name: 'United States', flag: '🇺🇸' },
        { name: 'United Kingdom', flag: '🇬🇧' },
        { name: 'Canada', flag: '🇨🇦' },
        { name: 'Australia', flag: '🇦🇺' },
    ]

    return (
        <>
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900 relative overflow-x-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-center gap-8">



                            {/* Center Phone */}
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                            >
                                <div className="w-full h-full flex items-center justify-center">
                                    <Image
                                        src="/icons/Group856.svg"
                                        alt="Center Phone"
                                        width={754}
                                        height={565}
                                    />
                                </div>
                            </motion.div>


                        </div>
                    </motion.div>
                </div>
                <div className='w-full h-[600px] bg-gradient-to-t from-gray-900 to-transparent absolute bottom-0 z-20 pointer-events-none'></div>
                <div className='w-full h-[220px] blur-sm bg-gray-900 absolute bottom-10 z-20 pointer-events-none'></div>
            </section>

            <section>
                {/* Country Marquee Section */}
                <div className="mt-20 relative z-10">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12"
                    >
                        Downloaded by across thousand of countries
                    </motion.h2>

                    {/* Marquee Container */}
                    <div className="relative overflow-hidden">
                        <div className="flex animate-marquee whitespace-nowrap">
                            {/* First set of countries */}
                            {countries.map((country, index) => (
                                <div key={`country-1-${index}`} className="inline-flex items-center gap-3 mx-8">
                                    <span className="text-4xl">{country.flag}</span>
                                    <span className="text-gray-800 text-lg font-medium">{country.name}</span>
                                </div>
                            ))}
                            {/* Duplicate set for seamless loop */}
                            {countries.map((country, index) => (
                                <div key={`country-2-${index}`} className="inline-flex items-center gap-3 mx-8">
                                    <span className="text-4xl">{country.flag}</span>
                                    <span className="text-gray-800 text-lg font-medium">{country.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Custom CSS for marquee animation */}
                <style jsx>{`
                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
                .animate-marquee:hover {
                    animation-play-state: paused;
                }
            `}</style>
            </section>
        </>
    )
}

export default FeaturesShowcase
