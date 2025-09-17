import { useEffect, useRef, useLayoutEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Use useLayoutEffect on client, useEffect on server
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Custom hook for GSAP animations
export const useGSAP = (
  callback: (context: { timeline: gsap.core.Timeline; selector: (selector: string) => HTMLElement[] }) => void,
  dependencies: any[] = []
) => {
  const containerRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Create timeline
    const timeline = gsap.timeline({ paused: true });
    timelineRef.current = timeline;

    // Selector function scoped to container
    const selector = (sel: string): HTMLElement[] => {
      if (!containerRef.current) return [];
      return Array.from(containerRef.current.querySelectorAll(sel));
    };

    // Execute callback with context
    callback({ timeline, selector });

    // Play timeline
    timeline.play();

    // Cleanup function
    return () => {
      timeline.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger && containerRef.current?.contains(trigger.trigger as Node)) {
          trigger.kill();
        }
      });
    };
  }, dependencies);

  return { containerRef, timeline: timelineRef.current };
};

// Hook for scroll-triggered animations
export const useScrollAnimation = (
  callback: (elements: HTMLElement[]) => void,
  selector: string,
  options: ScrollTrigger.Vars = {}
) => {
  const containerRef = useRef<HTMLElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    gsap.registerPlugin(ScrollTrigger);

    const elements = Array.from(containerRef.current.querySelectorAll(selector)) as HTMLElement[];
    
    if (elements.length === 0) return;

    const defaultOptions: ScrollTrigger.Vars = {
      trigger: containerRef.current,
      start: 'top 80%',
      toggleActions: 'play none none reverse',
      ...options,
    };

    // Create ScrollTrigger
    const trigger = ScrollTrigger.create({
      ...defaultOptions,
      onEnter: () => callback(elements),
      onLeave: () => {
        if (defaultOptions.toggleActions?.includes('reverse')) {
          gsap.set(elements, { opacity: 0, y: 50 });
        }
      },
    });

    return () => {
      trigger.kill();
    };
  }, [selector, JSON.stringify(options)]);

  return containerRef;
};

// Hook for typewriter effect
export const useTypewriter = (
  text: string,
  speed: number = 50,
  delay: number = 0
) => {
  const elementRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const element = elementRef.current;
    const chars = text.split('');
    
    // Clear element
    element.innerHTML = '';
    
    // Create timeline
    const timeline = gsap.timeline({ delay });
    timelineRef.current = timeline;
    
    // Add each character
    chars.forEach((char, index) => {
      timeline.to({}, {
        duration: speed / 1000,
        onComplete: () => {
          element.innerHTML += char === ' ' ? '&nbsp;' : char;
        },
      });
    });

    return () => {
      timeline.kill();
    };
  }, [text, speed, delay]);

  return { elementRef, timeline: timelineRef.current };
};

// Hook for hover animations
export const useHoverAnimation = (
  enterAnimation: (element: HTMLElement) => gsap.core.Tween,
  leaveAnimation: (element: HTMLElement) => gsap.core.Tween
) => {
  const elementRef = useRef<HTMLElement>(null);
  const enterTweenRef = useRef<gsap.core.Tween | null>(null);
  const leaveTweenRef = useRef<gsap.core.Tween | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const element = elementRef.current;

    const handleMouseEnter = () => {
      if (leaveTweenRef.current) leaveTweenRef.current.kill();
      enterTweenRef.current = enterAnimation(element);
    };

    const handleMouseLeave = () => {
      if (enterTweenRef.current) enterTweenRef.current.kill();
      leaveTweenRef.current = leaveAnimation(element);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (enterTweenRef.current) enterTweenRef.current.kill();
      if (leaveTweenRef.current) leaveTweenRef.current.kill();
    };
  }, []);

  return elementRef;
};

// Hook for continuous animations
export const useContinuousAnimation = (
  animation: (element: HTMLElement) => gsap.core.Tween
) => {
  const elementRef = useRef<HTMLElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    tweenRef.current = animation(elementRef.current);

    return () => {
      if (tweenRef.current) tweenRef.current.kill();
    };
  }, []);

  return elementRef;
};

// Hook for intersection observer with GSAP
export const useIntersectionAnimation = (
  animation: (element: HTMLElement, isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !elementRef.current) return;

    const defaultOptions: IntersectionObserverInit = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px',
      ...options,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        animation(entry.target as HTMLElement, entry.isIntersecting);
      });
    }, defaultOptions);

    observer.observe(elementRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return elementRef;
};