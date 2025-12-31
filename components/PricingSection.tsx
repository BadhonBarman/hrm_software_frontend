'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const PricingSection = () => {
    const plans = [
        {
            name: 'Basic',
            price: 'Free',
            period: '',
            features: [
                'Access to basic features',
                'Limited usage',
                'Community support',
            ],
            color: 'bg-gray-700',
            buttonText: 'Try Now',
            buttonStyle: 'border-2 border-white/30 bg-transparent hover:bg-white/10',
        },
        {
            name: 'Monthly',
            price: '$14.99',
            period: '',
            features: [
                'All Free plan features',
                'Increased limits',
                'Priority support',
                'Access to some premium tools',
            ],
            color: 'bg-cyan-500',
            buttonText: 'Buy Now',
            buttonStyle: 'border-2 border-white/30 bg-transparent hover:bg-white/10',
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
                        "select your plan"
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Unlock premium features with the right plan
                    </p>
                </motion.div>

                {/* Pricing Cards */}
                <div className="flex flex-col md:flex-row gap-8 justify-center items-center max-w-4xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="w-full md:w-80 relative"
                            style={{
                                transform: index === 0 ? 'skewY(-10deg)' : 'skewY(10deg)',
                            }}
                        >
                            <Card
                                className={`h-full ${plan.color} text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden rounded-2xl`}
                                style={{
                                    transform: 'rotate(0deg)',
                                }}
                            >
                                <CardHeader className="text-center pb-6 pt-8">
                                    <CardTitle className="text-xl mb-4 font-normal">{plan.name}</CardTitle>
                                    <div className="mb-6">
                                        <span className="text-5xl font-bold">{plan.price}</span>
                                    </div>
                                    <hr className="border-white/20" />
                                </CardHeader>
                                <CardContent className="space-y-4 px-6">
                                    {plan.features.map((feature) => (
                                        <div key={feature} className="flex items-start gap-3">
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <span className="text-base">{feature}</span>
                                        </div>
                                    ))}
                                </CardContent>
                                <CardFooter className="pt-8 pb-8 px-6">
                                    <Button
                                        className={`w-full ${plan.buttonStyle} text-white font-semibold rounded-full py-6 text-lg`}
                                        size="lg"
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default PricingSection
