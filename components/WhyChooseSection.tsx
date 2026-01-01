'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Shield, Headphones, Award } from 'lucide-react'
import Image from 'next/image'

const WhyChooseSection = () => {
    const reasons = [
        {
            icon: Zap,
            title: 'Reliability',
            description: 'Trusted by thousands of users worldwide.',
            color: 'bg-green-500',
        },
        {
            icon: Shield,
            title: 'Easy to Use',
            description: 'User-friendly interface designed for everyone.',
            color: 'bg-blue-500',
        },
        {
            icon: Headphones,
            title: 'Affordable',
            description: 'Get premium features at competitive prices.',
            color: 'bg-orange-500',
        },
    ]

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        "Why choose us"
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Join thousands of teachers who trust hrmian to streamline their teaching workflow.
                    </p>
                </motion.div>

                {/* Content */}
                <div className="flex flex-row justify-center gap-12">
                    {/* Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >

                        <Image
                            src="/icons/Group869.svg"
                            alt="Why Choose Us"
                            width={500}
                            height={500}
                        />

                    </motion.div>

                    {/* Colored Cards */}
                    <div className="space-y-6">
                        {reasons.map((reason, index) => (
                            <motion.div
                                key={reason.title}
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                                <Card className={`${reason.color} border-0 text-white hover:scale-105 transition-transform duration-300`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <reason.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold mb-2">{reason.title}</h3>
                                                <p className="text-white/90">{reason.description}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WhyChooseSection
