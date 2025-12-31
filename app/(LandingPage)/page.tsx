import React from 'react'
import HeroSection from '@/components/HeroSection'
import FeaturesShowcase from '@/components/FeaturesShowcase'
import LessonPlanningSection from '@/components/LessonPlanningSection'
import WorkflowSection from '@/components/WorkflowSection'
import WhyChooseSection from '@/components/WhyChooseSection'
import PricingSection from '@/components/PricingSection'
import Footer from '@/components/Footer'

const LandingPage = () => {
    return (
        <main className="min-h-screen">
            <HeroSection />
            <FeaturesShowcase />
            <LessonPlanningSection />
            <WorkflowSection />
            <WhyChooseSection />
            <PricingSection />
            <Footer />
        </main>
    )
}

export default LandingPage