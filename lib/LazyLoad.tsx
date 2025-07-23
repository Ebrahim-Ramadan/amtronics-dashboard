'use client';
import { useEffect, useRef, useState } from 'react';

interface LazyLoadProps {
  children: React.ReactNode;
}

export const LazyLoad = ({ children }: LazyLoadProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // the root margin
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
    >
      {isVisible ? children : null}
    </div>
  );
};

export default LazyLoad;
