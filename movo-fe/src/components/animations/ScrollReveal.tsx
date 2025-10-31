import React, { useEffect, useRef, ReactNode, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  delay?: number;
  duration?: number;
  ease?: string;
  scrollStart?: string;
  scrollEnd?: string;
  y?: number;
  opacity?: number;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  scrollContainerRef,
  delay = 0,
  duration = 0.8,
  ease = 'power2.out',
  scrollStart = 'top bottom-=100',
  scrollEnd = 'bottom top+=100',
  y = 50,
  opacity = 0,
}) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    const scroller = scrollContainerRef?.current || window;

    gsap.fromTo(
      el,
      {
        opacity: opacity,
        y: y,
      },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        ease: ease,
        delay: delay,
        scrollTrigger: {
          trigger: el,
          scroller,
          start: scrollStart,
          end: scrollEnd,
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [scrollContainerRef, delay, duration, ease, scrollStart, scrollEnd, y, opacity]);

  return <div ref={elementRef}>{children}</div>;
};

export default ScrollReveal;