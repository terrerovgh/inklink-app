'use client';

import React, { useState, useEffect } from 'react';
import { useScrollAnimation } from '../hooks/useGSAP';
import { fadeIn } from '../utils/animations';
import { gsap } from 'gsap';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
  studio: string;
  location: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Art Director',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20young%20woman%20with%20tattoos%20smiling&image_size=square',
    content: 'InkLink helped me find the perfect artist for my sleeve tattoo. The platform made it so easy to browse portfolios and connect with talented artists in my area.',
    rating: 5,
    studio: 'Ink Masters Studio',
    location: 'New York, NY',
  },
  {
    id: '2',
    name: 'Marcus Rodriguez',
    role: 'Software Engineer',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20hispanic%20man%20with%20geometric%20tattoos&image_size=square',
    content: 'As a first-time tattoo client, I was nervous about the process. InkLink\'s detailed artist profiles and reviews gave me the confidence to book my appointment.',
    rating: 5,
    studio: 'Sacred Geometry',
    location: 'London, UK',
  },
  {
    id: '3',
    name: 'Emma Thompson',
    role: 'Graphic Designer',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=creative%20portrait%20of%20blonde%20woman%20with%20colorful%20tattoos&image_size=square',
    content: 'The booking system is incredibly smooth, and I love how I can see real-time availability. Found my go-to artist through InkLink and couldn\'t be happier!',
    rating: 5,
    studio: 'Electric Canvas',
    location: 'Los Angeles, CA',
  },
  {
    id: '4',
    name: 'David Kim',
    role: 'Photographer',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=artistic%20portrait%20of%20asian%20man%20with%20traditional%20tattoos&image_size=square',
    content: 'InkLink\'s global reach is amazing. I was traveling for work and needed touch-up work done. Found a fantastic artist within minutes of landing in Tokyo.',
    rating: 5,
    studio: 'Dragon Ink',
    location: 'Tokyo, Japan',
  },
  {
    id: '5',
    name: 'Lisa Anderson',
    role: 'Marketing Manager',
    avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20redhead%20woman%20with%20minimalist%20tattoos&image_size=square',
    content: 'The quality of artists on InkLink is outstanding. Every recommendation has been spot-on, and the community aspect makes the whole experience more enjoyable.',
    rating: 5,
    studio: 'Neon Dreams',
    location: 'Berlin, Germany',
  },
];

const TestimonialCard: React.FC<{ testimonial: Testimonial; isActive: boolean }> = ({
  testimonial,
  isActive,
}) => {
  return (
    <div
      className={`testimonial-card transition-all duration-500 transform ${
        isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
      }`}
    >
      <div className="relative p-8 border border-gray-800 bg-black">
        {/* Quote icon */}
        <div className="absolute top-6 left-6 text-gray-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Rating */}
          <div className="flex items-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${
                  i < testimonial.rating ? 'text-white' : 'text-gray-600'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>

          {/* Testimonial text */}
          <p className="text-white text-base leading-relaxed mb-8 font-light">
            "{testimonial.content}"
          </p>

          {/* Author info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover border border-gray-700"
              />
            </div>
            <div>
              <h4 className="text-white font-medium text-sm">{testimonial.name}</h4>
              <p className="text-gray-400 text-xs">{testimonial.role}</p>
              <p className="text-gray-500 text-xs">
                {testimonial.studio} • {testimonial.location}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestimonialsCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const containerRef = useScrollAnimation(
    (element) => {
      fadeIn(element, {
        duration: 0.8,
        y: 30,
        ease: 'power2.out',
      });
    },
    null,
    {
      start: 'top 80%',
      end: 'bottom 20%',
    }
  );

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10 seconds
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-16 md:py-24 bg-black relative">
      <div ref={containerRef} className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 tracking-tight">
            What Our Community Says
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Real stories from tattoo enthusiasts who found their perfect artists through InkLink.
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main testimonial */}
          <div className="relative h-96 flex items-center justify-center">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`absolute inset-0 transition-all duration-700 transform ${
                  index === currentIndex
                    ? 'translate-x-0 opacity-100 scale-100'
                    : index < currentIndex
                    ? '-translate-x-full opacity-0 scale-95'
                    : 'translate-x-full opacity-0 scale-95'
                }`}
              >
                <TestimonialCard
                  testimonial={testimonial}
                  isActive={index === currentIndex}
                />
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 border border-gray-800 bg-black text-white hover:border-gray-600 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 border border-gray-800 bg-black text-white hover:border-gray-600 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 transition-all duration-200 ${
                  index === currentIndex
                    ? 'bg-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-gray-800 h-px overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300 ease-linear"
              style={{
                width: isAutoPlaying ? '100%' : '0%',
                animation: isAutoPlaying ? 'progress 5s linear infinite' : 'none',
              }}
            />
          </div>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-center">
          <div>
            <div className="text-2xl font-light text-white mb-1">4.9/5</div>
            <div className="text-gray-500 text-sm font-light">Average Rating</div>
          </div>
          <div>
            <div className="text-2xl font-light text-white mb-1">50,000+</div>
            <div className="text-gray-500 text-sm font-light">Happy Reviews</div>
          </div>
          <div>
            <div className="text-2xl font-light text-white mb-1">98%</div>
            <div className="text-gray-500 text-sm font-light">Satisfaction Rate</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};

export default TestimonialsCarousel;