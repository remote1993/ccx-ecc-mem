import React, { useState, useEffect } from 'react';
import type { ViewerLabels } from '../i18n';

interface ScrollToTopProps {
  targetRef: React.RefObject<HTMLDivElement>;
  labels: ViewerLabels;
}

export function ScrollToTop({ targetRef, labels }: ScrollToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const target = targetRef.current;
      if (target) {
        setIsVisible(target.scrollTop > 300);
      }
    };

    const target = targetRef.current;
    if (target) {
      target.addEventListener('scroll', handleScroll);
      return () => target.removeEventListener('scroll', handleScroll);
    }
  }, []); // Empty deps - only set up listener once on mount

  const scrollToTop = () => {
    const target = targetRef.current;
    if (target) {
      target.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="scroll-to-top"
      aria-label={labels.scrollToTop}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  );
}
