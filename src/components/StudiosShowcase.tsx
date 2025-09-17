'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useScrollAnimation, useHoverAnimation, useContinuousAnimation } from '../hooks/useGSAP';
import { scrollStaggerIn, floatingAnimation } from '../utils/animations';
import { gsap } from 'gsap';

interface Studio {
  id: string;
  name: string;
  location: string;
  rating: number;
  specialties: string[];
  image: string;
  featured: boolean;
  coordinates: [number, number];
}

const studios: Studio[] = [
  {
    id: '1',
    name: 'Ink Masters Studio',
    location: 'New York, NY',
    rating: 4.9,
    specialties: ['Traditional', 'Neo-Traditional', 'Blackwork'],
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20tattoo%20studio%20interior%20with%20neon%20lights%20and%20artistic%20equipment&image_size=square',
    featured: true,
    coordinates: [40.7128, -74.0060],
  },
  {
    id: '2',
    name: 'Electric Canvas',
    location: 'Los Angeles, CA',
    rating: 4.8,
    specialties: ['Realism', 'Color Work', 'Portraits'],
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=vibrant%20tattoo%20parlor%20with%20colorful%20artwork%20and%20modern%20design&image_size=square',
    featured: true,
    coordinates: [34.0522, -118.2437],
  },
  {
    id: '3',
    name: 'Sacred Geometry',
    location: 'London, UK',
    rating: 4.7,
    specialties: ['Geometric', 'Dotwork', 'Minimalist'],
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=minimalist%20tattoo%20studio%20with%20geometric%20patterns%20and%20clean%20design&image_size=square',
    featured: false,
    coordinates: [51.5074, -0.1278],
  },
  {
    id: '4',
    name: 'Dragon Ink',
    location: 'Tokyo, Japan',
    rating: 4.9,
    specialties: ['Japanese', 'Traditional', 'Irezumi'],
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=traditional%20japanese%20tattoo%20studio%20with%20cultural%20elements%20and%20artistic%20atmosphere&image_size=square',
    featured: true,
    coordinates: [35.6762, 139.6503],
  },
  {
    id: '5',
    name: 'Neon Dreams',
    location: 'Berlin, Germany',
    rating: 4.6,
    specialties: ['Cyberpunk', 'Neon', 'Futuristic'],
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cyberpunk%20tattoo%20studio%20with%20neon%20lights%20and%20futuristic%20design&image_size=square',
    featured: false,
    coordinates: [52.5200, 13.4050],
  },
  {
    id: '6',
    name: 'Tribal Roots',
    location: 'Sydney, Australia',
    rating: 4.8,
    specialties: ['Tribal', 'Polynesian', 'Cultural'],
    image: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=tribal%20tattoo%20studio%20with%20cultural%20artwork%20and%20traditional%20elements&image_size=square',
    featured: false,
    coordinates: [-33.8688, 151.2093],
  },
];

const Particle = ({ delay, index }: { delay: number; index: number }) => {
  const particleRef = useContinuousAnimation((element) => {
    return gsap.to(element, {
      y: -50,
      opacity: 0.2,
      duration: 4 + (index % 2),
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      delay
    });
  });

  return (
    <div
      ref={particleRef}
      className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-20"
      style={{
        left: `${((index * 19 + 31) % 100)}%`,
        top: `${((index * 23 + 41) % 100)}%`
      }}
    />
  );
};

const StudioCard: React.FC<{ studio: Studio; index: number }> = ({ studio, index }) => {
  const cardRef = useHoverAnimation(
    (element) => {
      return gsap.to(element, {
        y: -8,
        duration: 0.3,
        ease: 'power1.out',
      });
    },
    (element) => {
      return gsap.to(element, {
        y: 0,
        duration: 0.3,
        ease: 'power1.out',
      });
    }
  );

  return (
    <div
      ref={cardRef}
      className={`studio-card group relative overflow-hidden border border-white/10 bg-black transition-all duration-300 hover:border-white/20 ${
        studio.featured ? 'lg:col-span-2 lg:row-span-2' : ''
      }`}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={studio.image}
          alt={studio.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />
      </div>

      {/* Featured badge */}
      {studio.featured && (
        <div className="absolute top-6 right-6 z-20">
          <div className="px-4 py-2 bg-white text-black text-xs font-light uppercase tracking-widest">
            Featured
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-end">
        {/* Rating */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(studio.rating) ? 'text-white' : 'text-white/30'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-white/70 text-sm font-light">{studio.rating}</span>
        </div>

        {/* Studio name */}
        <h3 className="text-xl lg:text-2xl font-light text-white mb-3 tracking-tight">
          {studio.name}
        </h3>

        {/* Location */}
        <p className="text-white/50 mb-6 flex items-center gap-2 text-sm">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {studio.location}
        </p>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-6">
          {studio.specialties.slice(0, 3).map((specialty) => (
            <span
              key={specialty}
              className="px-3 py-1 border border-white/20 text-white text-xs font-light uppercase tracking-wider"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <button className="w-full py-4 bg-white text-black font-light uppercase tracking-widest text-sm transition-all duration-300 hover:bg-white/90 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0">
          View Studio
        </button>
      </div>
    </div>
  );
};

const StudiosShowcase: React.FC = () => {
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const containerRef = useScrollAnimation(
    (elements) => {
      scrollStaggerIn(elements, {
        duration: 0.6,
        stagger: 0.08,
        y: 40,
        ease: 'power1.out',
      });
    },
    '.studio-card',
    {
      start: 'top 85%',
      end: 'bottom 15%',
    }
  );

  return (
    <section className="py-24 md:py-32 bg-black relative">
      {/* Animated particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <Particle key={i} delay={i * 0.3} index={i} />
        ))}
      </div>

      <div ref={containerRef} className="container mx-auto px-8 md:px-12 lg:px-16 relative z-10">
        {/* Section header */}
        <div className="text-center mb-20 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-8 tracking-tight">
            Featured <span className="font-extralight">Studios</span>
          </h2>
          <p className="text-lg md:text-xl text-white/50 max-w-3xl mx-auto leading-relaxed">
            Discover world-class tattoo studios and connect with renowned artists from around the globe.
          </p>
        </div>

        {/* Studios grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16 mb-20 md:mb-24">
          {studios.map((studio, index) => (
            <StudioCard key={studio.id} studio={studio} index={index} />
          ))}
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 mb-20 md:mb-24">
          {[
            { label: 'Studios Worldwide', value: '10,000+' },
            { label: 'Verified Artists', value: '25,000+' },
            { label: 'Happy Clients', value: '500,000+' },
            { label: 'Countries', value: '150+' },
          ].map((stat, index) => (
            <div key={index} className="text-center space-y-3">
              <div className="text-2xl md:text-3xl lg:text-4xl font-light text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-white/40 text-xs md:text-sm uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="group px-12 py-4 bg-white text-black font-light uppercase tracking-widest text-sm transition-all duration-300 hover:bg-white/90">
              <span className="flex items-center gap-3">
                Explore All Studios
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            <button className="px-12 py-4 border border-white/20 text-white font-light uppercase tracking-widest text-sm transition-all duration-300 hover:border-white/40">
              Join as Studio
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudiosShowcase;