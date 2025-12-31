'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, ClipboardCheck, BarChart3, Users } from 'lucide-react'

const WorkflowSection = () => {
    const features = [
        {
            icon: BookOpen,
            title: 'Lesson Planning',
            description: 'Create and organize lesson plans with ease. Add resources, notes, and schedules all in one place.',
        },
        {
            icon: ClipboardCheck,
            title: 'Mark Entry',
            description: 'Quick and efficient grade entry system. Track student performance and generate reports instantly.',
        },
        {
            icon: BarChart3,
            title: 'System Analytics',
            description: 'Comprehensive analytics dashboard to monitor class performance and identify areas for improvement.',
        },
        {
            icon: Users,
            title: 'Attendance',
            description: 'Simple attendance tracking with automated reports. Monitor student presence patterns effortlessly.',
        },
    ]

    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                {/* Section Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
                        "Simplify Your Teaching Workflow"
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Everything you need to manage your classroom efficiently, all in one powerful platform.
                    </p>
                </motion.div>

                {/* Feature Cards Grid */}
                <div className="grid sm:grid-cols-1 lg:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <Card className="h-full rounded-lg hover:shadow-sm text-center transition-shadow duration-300 border px-8 pb-8 pt-16 hover:border-blue-500">
                                <CardHeader>
                                    {/* <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-blue-600" />
                                    </div> */}
                                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-gray-600 text-lg">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default WorkflowSection
