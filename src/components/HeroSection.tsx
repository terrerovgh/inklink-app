'use client';

import React, { useEffect, useRef, useState } from 'react';
import InteractiveGlobe, { Studio } from './InteractiveGlobe';
import { useTypewriter, useGSAP, useScrollAnimation } from '../hooks/useGSAP';
import { fadeIn, staggerFadeIn, floatingAnimation } from '../utils/animations';
import { gsap } from 'gsap';

interface HeroSectionProps {
  studios?: Studio[];
  onGetStarted?: () => void;
  onExploreStudios?: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  studios = [],
  onGetStarted = () => {},
  onExploreStudios = () => {},
}) => {
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  // Gentle typewriter effect for main heading
  const { elementRef: titleRef } = useTypewriter(
    'Connect with Tattoo Artists Worldwide',
    60,
    0.3
  );

  // Gentle typewriter effect for subtitle
  const { elementRef: subtitleRef } = useTypewriter(
    'Discover talented artists, explore studios, and bring your ink vision to life',
    25,
    2.0
  );

  // GSAP animations for hero elements
  const { containerRef } = useGSAP(({ timeline, selector }) => {
    // Subtle container entrance
    timeline.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: 'power1.out' },
      0
    );

    // Animate globe container
    timeline.fromTo(
      globeContainerRef.current,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'power2.out' },
      0.6
    );

    // Gentle CTA buttons animation
    timeline.fromTo(
      selector('.cta-button'),
      { y: 15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power1.out' },
      1.5
    );

    // Minimal stats animation
    timeline.fromTo(
      selector('.stat-item'),
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power1.out' },
      1.8
    );

    // Floating animation for particles
    selector('.particle').forEach((particle, index) => {
      floatingAnimation(particle, {
        duration: gsap.utils.random(8, 12),
        delay: gsap.utils.random(0, 4),
        y: gsap.utils.random(-5, 5),
        x: gsap.utils.random(-3, 3),
      });
    });
  }, []);

  // Handle studio selection from globe
  const handleStudioClick = (studio: Studio) => {
    setSelectedStudio(studio);
    // Add a subtle animation when studio is selected
    if (globeContainerRef.current) {
      gsap.to(globeContainerRef.current, {
        scale: 1.02,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: 'power1.inOut',
      });
    }
  };

  // Create minimal floating particles for subtle movement
  const createParticles = () => {
    const particles = [];
    for (let i = 0; i < 5; i++) {
      particles.push(
        <div
          key={i}
          className="particle absolute w-px h-px bg-white rounded-full opacity-10"
          style={{
            left: `${((i * 20 + 30) % 80) + 10}%`,
            top: `${((i * 25 + 40) % 60) + 20}%`,
          }}
        />
      );
    }
    return particles;
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-black text-white overflow-hidden flex items-center py-12 md:py-0"
    >
      {/* Background particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {createParticles()}
      </div>

      {/* Background gradient - Minimalista */}
      <div className="absolute inset-0 bg-black" />

      <div className="container mx-auto px-8 md:px-12 lg:px-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left content */}
          <div className="space-y-12 md:space-y-16 text-center lg:text-left">
            {/* Main heading with typewriter effect */}
            <div className="space-y-8 md:space-y-10">
              <h1
                ref={titleRef}
                className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-tight tracking-tight"
                style={{ minHeight: '1.2em' }}
              />
              <p
                ref={subtitleRef}
                className="text-base md:text-lg lg:text-xl text-white/60 max-w-2xl leading-relaxed mx-auto lg:mx-0"
                style={{ minHeight: '1.5em' }}
              />
            </div>

            {/* CTA buttons - Mobile-first */}
            <div className="flex flex-col gap-6 md:gap-8 mt-16">
              <button
                onClick={onGetStarted}
                className="cta-button group w-full md:w-auto px-12 py-6 md:py-5 bg-white text-black font-normal text-lg md:text-base rounded-none border-2 border-white transition-all duration-300 hover:bg-black hover:text-white hover:border-white"
              >
                Get Started
              </button>
              
              <button
                onClick={onExploreStudios}
                className="cta-button group w-full md:w-auto px-12 py-6 md:py-5 border-2 border-white text-white font-normal text-lg md:text-base rounded-none transition-all duration-300 hover:bg-white hover:text-black"
              >
                <span className="flex items-center justify-center gap-4">
                  Explore Studios
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Stats - Mobile-first */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 pt-20 md:pt-16">
              <div className="stat-item text-center">
                <div className="text-4xl md:text-3xl lg:text-4xl font-extralight text-white mb-4 md:mb-2">10K+</div>
                <div className="text-base md:text-sm text-white/50 uppercase tracking-widest">Artists</div>
              </div>
              <div className="stat-item text-center">
                <div className="text-4xl md:text-3xl lg:text-4xl font-extralight text-white mb-4 md:mb-2">50K+</div>
                <div className="text-base md:text-sm text-white/50 uppercase tracking-widest">Tattoos</div>
              </div>
              <div className="stat-item text-center">
                <div className="text-4xl md:text-3xl lg:text-4xl font-extralight text-white mb-4 md:mb-2">100+</div>
                <div className="text-base md:text-sm text-white/50 uppercase tracking-widest">Cities</div>
              </div>
            </div>
          </div>

          {/* Right content - Globe */}
          <div className="relative h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] mt-16 lg:mt-0">
            <div
              ref={globeContainerRef}
              className="w-full h-full shadow-lg shadow-white/5"
            >
              <InteractiveGlobe
                studios={studios}
                onStudioClick={handleStudioClick}
                className="w-full h-full"
              />
              
              {/* Globe subtle shadow */}
              <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent rounded-full blur-2xl" />
            </div>

            {/* Selected studio info panel - Mobile-first */}
            {selectedStudio && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/95 border border-white/10 p-6 md:p-8 backdrop-blur-sm">
                <h3 className="text-lg md:text-xl font-light text-white mb-3">{selectedStudio.name}</h3>
                <p className="text-white/50 text-sm md:text-base mb-6">{selectedStudio.location}</p>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm uppercase tracking-widest">Rating:</span>
                    <span className="text-white font-light text-lg">{selectedStudio.rating}/5</span>
                  </div>
                  <button className="w-full md:w-auto px-6 py-3 md:py-2 bg-white text-black text-sm font-light uppercase tracking-widest hover:bg-white/90 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator - Mobile-first */}
      <div className="absolute bottom-12 md:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-8 h-12 md:w-6 md:h-10 border-2 border-white/20 rounded-full flex justify-center">
          <div className="w-1.5 h-4 md:w-1 md:h-3 bg-white/60 rounded-full mt-3 md:mt-2" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;