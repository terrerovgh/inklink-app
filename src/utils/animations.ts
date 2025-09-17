import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Animation configurations
export const animationConfig = {
  duration: {
    fast: 0.3,
    normal: 0.6,
    slow: 1.2,
    typewriter: 0.05,
  },
  ease: {
    smooth: 'power2.out',
    bounce: 'back.out(1.7)',
    elastic: 'elastic.out(1, 0.3)',
  },
};

// Typewriter effect
export const typewriterEffect = (element: HTMLElement, text: string, duration = 0.05) => {
  const chars = text.split('');
  element.innerHTML = '';
  
  const tl = gsap.timeline();
  
  chars.forEach((char, index) => {
    tl.to({}, {
      duration,
      onComplete: () => {
        element.innerHTML += char === ' ' ? '&nbsp;' : char;
      },
    });
  });
  
  return tl;
};

// Fade in animation
export const fadeIn = (element: HTMLElement | string, options = {}) => {
  const defaultOptions = {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.smooth,
    y: 30,
    opacity: 0,
  };
  
  return gsap.fromTo(
    element,
    { opacity: 0, y: defaultOptions.y },
    { opacity: 1, y: 0, ...defaultOptions, ...options }
  );
};

// Stagger animation for multiple elements
export const staggerFadeIn = (elements: HTMLElement[] | string, options = {}) => {
  const defaultOptions = {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.smooth,
    stagger: 0.1,
    y: 50,
  };
  
  return gsap.fromTo(
    elements,
    { opacity: 0, y: defaultOptions.y },
    { opacity: 1, y: 0, ...defaultOptions, ...options }
  );
};

// Scale animation
export const scaleIn = (element: HTMLElement | string, options = {}) => {
  const defaultOptions = {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.bounce,
    scale: 0,
  };
  
  return gsap.fromTo(
    element,
    { scale: 0, opacity: 0 },
    { scale: 1, opacity: 1, ...defaultOptions, ...options }
  );
};

// Slide in from direction
export const slideIn = (element: HTMLElement | string, direction = 'left', options = {}) => {
  const directions = {
    left: { x: -100, y: 0 },
    right: { x: 100, y: 0 },
    up: { x: 0, y: -100 },
    down: { x: 0, y: 100 },
  };
  
  const defaultOptions = {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.smooth,
  };
  
  const startPos = directions[direction as keyof typeof directions] || directions.left;
  
  return gsap.fromTo(
    element,
    { ...startPos, opacity: 0 },
    { x: 0, y: 0, opacity: 1, ...defaultOptions, ...options }
  );
};

// Parallax effect
export const parallaxEffect = (element: HTMLElement | string, speed = 0.5) => {
  return gsap.to(element, {
    yPercent: -50 * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
};

// Scroll-triggered fade in
export const scrollFadeIn = (element: HTMLElement | string, options = {}) => {
  const defaultOptions = {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.smooth,
    y: 50,
  };
  
  return gsap.fromTo(
    element,
    { opacity: 0, y: defaultOptions.y },
    {
      opacity: 1,
      y: 0,
      ...defaultOptions,
      ...options,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
        ...((options as any).scrollTrigger || {}),
      },
    }
  );
};

// Scroll-triggered stagger animation
export const scrollStaggerIn = (elements: HTMLElement[] | string, options = {}) => {
  const defaultOptions = {
    duration: animationConfig.duration.normal,
    ease: animationConfig.ease.smooth,
    stagger: 0.1,
    y: 50,
  };
  
  return gsap.fromTo(
    elements,
    { opacity: 0, y: defaultOptions.y },
    {
      opacity: 1,
      y: 0,
      ...defaultOptions,
      ...options,
      scrollTrigger: {
        trigger: elements,
        start: 'top 80%',
        toggleActions: 'play none none reverse',
        ...((options as any).scrollTrigger || {}),
      },
    }
  );
};

// Floating animation
export const floatingAnimation = (element: HTMLElement | string, options = {}) => {
  const defaultOptions = {
    duration: 3,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    y: -10,
  };
  
  return gsap.to(element, { ...defaultOptions, ...options });
};

// Glow effect animation
export const glowEffect = (element: HTMLElement | string, color = '#00D4FF') => {
  return gsap.to(element, {
    boxShadow: `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`,
    duration: 0.3,
    ease: animationConfig.ease.smooth,
    paused: true,
  });
};

// Text reveal animation
export const textReveal = (element: HTMLElement | string, options = {}) => {
  const defaultOptions = {
    duration: animationConfig.duration.slow,
    ease: animationConfig.ease.smooth,
  };
  
  return gsap.fromTo(
    element,
    { clipPath: 'inset(0 100% 0 0)' },
    { clipPath: 'inset(0 0% 0 0)', ...defaultOptions, ...options }
  );
};

// Initialize ScrollTrigger refresh
export const refreshScrollTrigger = () => {
  if (typeof window !== 'undefined') {
    ScrollTrigger.refresh();
  }
};

// Kill all ScrollTriggers
export const killScrollTriggers = () => {
  if (typeof window !== 'undefined') {
    ScrollTrigger.killAll();
  }
};

// Master timeline for coordinated animations
export const createMasterTimeline = () => {
  return gsap.timeline({ paused: true });
};

// Particle animation
export const particleFloat = (element: HTMLElement | string, options = {}) => {
  const defaultOptions = {
    duration: gsap.utils.random(2, 4),
    x: gsap.utils.random(-50, 50),
    y: gsap.utils.random(-50, 50),
    rotation: gsap.utils.random(-180, 180),
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
  };
  
  return gsap.to(element, { ...defaultOptions, ...options });
};