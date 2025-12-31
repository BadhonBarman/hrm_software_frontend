'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'

const LessonPlanningSection = () => {
    return (
        <section className="py-20 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        "Seamless Lesson Planning"
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Design lessons, assign homework, and monitor student progress
                        <br />
                        <span>—all in one app.</span>
                    </p>
                </motion.div>

            </div>

            {/* Content */}
            <div className="py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className='w-full h-[300px] bg-gradient-to-t from-gray-900 to-transparent absolute left-0 bottom-0'></div>
                <div className='w-full h-[120px] blur-sm bg-gray-900 absolute bottom-10 z-20 left-0'></div>
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
                                        src="/icons/Group885.svg"
                                        alt="Center Phone"
                                        width={954}
                                        height={765}
                                    />
                                </div>
                            </motion.div>


                        </div>
                    </motion.div>
                </div>
                <div className='w-full h-[520px] bg-gray-900 z-0 absolute left-0 bottom-0'></div>
            </div>

        </section>
    )
}

export default LessonPlanningSection
