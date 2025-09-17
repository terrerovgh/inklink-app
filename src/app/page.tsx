'use client';

import React from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import StudiosShowcase from '@/components/StudiosShowcase';
import TestimonialsCarousel from '@/components/TestimonialsCarousel';
import CTASection from '@/components/CTASection';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <StudiosShowcase />
      <TestimonialsCarousel />
      <CTASection />
    </div>
  );
}
