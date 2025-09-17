'use client';

import React from 'react';
import { useScrollAnimation, useHoverAnimation } from '../hooks/useGSAP';
import { scrollStaggerIn, glowEffect } from '../utils/animations';
import { gsap } from 'gsap';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const features: Feature[] = [
  {
    id: 'discover',
    title: 'Discover Artists',
    description: 'Find talented tattoo artists near you with our interactive map and advanced search filters.',
    color: 'white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    id: 'portfolio',
    title: 'Browse Portfolios',
    description: 'Explore stunning portfolios and find the perfect artist whose style matches your vision.',
    color: 'white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'booking',
    title: 'Easy Booking',
    description: 'Book appointments seamlessly with integrated scheduling and secure payment processing.',
    color: 'white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'community',
    title: 'Join Community',
    description: 'Connect with fellow tattoo enthusiasts, share experiences, and get inspired.',
    color: 'white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'reviews',
    title: 'Trusted Reviews',
    description: 'Read authentic reviews and ratings from real clients to make informed decisions.',
    color: 'white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    id: 'global',
    title: 'Global Reach',
    description: 'Access a worldwide network of artists and studios, wherever your journey takes you.',
    color: 'white',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => {
  const cardRef = useHoverAnimation(
    (element) => {
      return gsap.to(element, {
        y: -10,
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out',
      });
    },
    (element) => {
      return gsap.to(element, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      });
    }
  );

  const getColorClasses = () => {
    return 'border-white/10 text-white';
  };

  return (
    <div
      ref={cardRef}
      className={`feature-card group relative p-8 md:p-10 border ${getColorClasses()} bg-black transition-all duration-300 hover:border-white/20`}
    >
      {/* Content */}
      <div className="space-y-6">
        {/* Icon */}
        <div className="inline-flex p-4 border border-white/10 text-white">
          {feature.icon}
        </div>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-light text-white tracking-tight">
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-white/60 leading-relaxed text-base">
          {feature.description}
        </p>

        {/* Hover effect arrow */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="inline-flex items-center text-sm font-light text-white uppercase tracking-widest">
            Learn more
            <svg className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const containerRef = useScrollAnimation(
    (elements) => {
      scrollStaggerIn(elements, {
        duration: 0.6,
        stagger: 0.05,
        y: 30,
        ease: 'power1.out',
      });
    },
    '.feature-card',
    {
      start: 'top 85%',
      end: 'bottom 15%',
    }
  );

  return (
    <section className="py-24 md:py-32 bg-black relative">
      <div ref={containerRef} className="container mx-auto px-8 md:px-12 lg:px-16 relative z-10">
        {/* Section header */}
        <div className="text-center mb-20 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-8 tracking-tight">
            Why Choose <span className="font-extralight">InkLink</span>
          </h2>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
            Discover the features that make InkLink the premier platform for connecting tattoo enthusiasts with world-class artists.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 lg:gap-20">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;