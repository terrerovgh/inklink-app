'use client';

import React from 'react';
import { useScrollAnimation, useHoverAnimation } from '../hooks/useGSAP';
import { fadeIn, glowEffect, floatingAnimation } from '../utils/animations';
import { gsap } from 'gsap';

const FloatingElement: React.FC<{ delay: number; size: string; index: number }> = ({
  delay,
  size,
  index,
}) => {
  const elementRef = useScrollAnimation(
    (element) => {
      floatingAnimation(element, {
        duration: 6 + (index % 2),
        delay: delay,
        y: 20 + (index % 3) * 2,
        x: 10 + (index % 2) * 2,
        rotation: 180,
      });
    },
    null,
    {
      start: 'top bottom',
      end: 'bottom top',
    }
  );

  return (
    <div
      ref={elementRef}
      className={`absolute ${size} bg-white/10 rounded-full opacity-20`}
      style={{
        left: `${((index * 13 + 29) % 100)}%`,
        top: `${((index * 37 + 43) % 100)}%`,
      }}
    />
  );
};

const AnimatedButton: React.FC<{
  children: React.ReactNode;
  variant: 'primary' | 'secondary';
  onClick?: () => void;
}> = ({ children, variant, onClick }) => {
  const buttonRef = useHoverAnimation(
    (element) => {
      const tl = gsap.timeline();
      tl.to(element, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out',
      });
      return tl;
    },
    (element) => {
      const tl = gsap.timeline();
      tl.to(element, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
      });
      return tl;
    }
  );

  const baseClasses = 'relative px-12 py-4 font-light uppercase tracking-widest text-sm transition-all duration-300 group';
  const variantClasses = {
    primary: 'bg-white text-black hover:bg-white/90',
    secondary: 'border border-white/20 text-white hover:border-white/40',
  };

  return (
    <button
      ref={buttonRef}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      <span className="flex items-center gap-3">
        {children}
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </span>
    </button>
  );
};

const StatsCounter: React.FC<{ value: string; label: string; delay: number }> = ({
  value,
  label,
  delay,
}) => {
  const counterRef = useScrollAnimation(
    (element) => {
      gsap.fromTo(
        element.querySelector('.counter-value'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: delay,
          ease: 'power2.out',
        }
      );
      gsap.fromTo(
        element.querySelector('.counter-label'),
        { opacity: 0, y: 15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: delay + 0.1,
          ease: 'power2.out',
        }
      );
    },
    null,
    {
      start: 'top 85%',
      end: 'bottom 15%',
    }
  );

  return (
    <div ref={counterRef} className="text-center space-y-3">
      <div className="counter-value text-2xl md:text-3xl lg:text-4xl font-light text-white tracking-tight">
        {value}
      </div>
      <div className="counter-label text-white/40 text-xs md:text-sm uppercase tracking-widest">
        {label}
      </div>
    </div>
  );
};

const CTASection: React.FC = () => {
  const containerRef = useScrollAnimation(
    (element) => {
      const tl = gsap.timeline();
      
      // Animate main heading
      tl.fromTo(
        element.querySelector('.cta-heading'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
        }
      );
      
      // Animate subheading
      tl.fromTo(
        element.querySelector('.cta-subheading'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
        },
        '-=0.4'
      );
      
      // Animate buttons
      tl.fromTo(
        element.querySelectorAll('.cta-button'),
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
        },
        '-=0.2'
      );
      
      return tl;
    },
    null,
    {
      start: 'top 80%',
      end: 'bottom 20%',
    }
  );

  const stats = [
    { value: '25K+', label: 'Artists', delay: 0 },
    { value: '10K+', label: 'Studios', delay: 0.1 },
    { value: '500K+', label: 'Bookings', delay: 0.2 },
    { value: '150+', label: 'Countries', delay: 0.3 },
  ];

  return (
    <section className="py-24 md:py-32 bg-black relative overflow-hidden">
      {/* Minimal background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => ({
          delay: i * 0.5,
          size: ['w-1 h-1', 'w-2 h-2'][i % 2],
        })).map((element, i) => (
          <FloatingElement
            key={i}
            delay={element.delay}
            size={element.size}
            index={i}
          />
        ))}
      </div>

      <div ref={containerRef} className="container mx-auto px-6 lg:px-8 relative z-10">
        {/* Main CTA content */}
        <div className="text-center mb-20 md:mb-24">
          <h2 className="cta-heading text-4xl md:text-5xl lg:text-6xl font-light text-white mb-8 md:mb-12 leading-tight tracking-tight">
            Ready to Find Your
            <br />
            <span className="text-white">
              Perfect Artist?
            </span>
          </h2>
          
          <p className="cta-subheading text-lg md:text-xl lg:text-2xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-12 md:mb-16 font-light">
            Join thousands of tattoo enthusiasts who have discovered their ideal artists through InkLink.
            Start your journey today and bring your vision to life.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center items-center mb-20 md:mb-24">
            <div className="cta-button">
              <AnimatedButton variant="primary" onClick={() => window.location.href = '/search'}>
                Get Started Now
              </AnimatedButton>
            </div>
            <div className="cta-button">
              <AnimatedButton variant="secondary" onClick={() => window.location.href = '/search'}>
                Browse Artists
              </AnimatedButton>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-20 md:mb-24">
          {stats.map((stat, index) => (
            <StatsCounter
              key={index}
              value={stat.value}
              label={stat.label}
              delay={stat.delay}
            />
          ))}
        </div>

        {/* Features highlight */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 max-w-5xl mx-auto">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              title: 'Instant Matching',
              description: 'Find artists that match your style in seconds',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: 'Verified Artists',
              description: 'All artists are verified and reviewed by our community',
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: 'Secure Booking',
              description: 'Safe and secure payment processing for all bookings',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="text-center p-8 md:p-10 border border-white/10 bg-black hover:border-white/20 transition-all duration-300"
            >
              <div className="inline-flex p-4 border border-white/20 text-white mb-6">
                {feature.icon}
              </div>
              <h3 className="text-lg font-light text-white mb-4 uppercase tracking-widest">
                {feature.title}
              </h3>
              <p className="text-white/60 text-sm font-light leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center mt-20 md:mt-24">
          <p className="text-white/40 mb-8 text-sm uppercase tracking-widest">
            Join the InkLink community today • No setup fees • Cancel anytime
          </p>
          <div className="flex justify-center">
            <AnimatedButton variant="primary" onClick={() => window.location.href = '/search'}>
              Start Your Journey
            </AnimatedButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;