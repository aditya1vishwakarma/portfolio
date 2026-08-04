import React, { useState, useEffect } from 'react';
import { motion as motionComponent, useSpring, useMotionValue } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { isMobileViewport } from '../../constants';

const motion = motionComponent as any;

const CircularScrollIndicator: React.FC = () => {
  const progressValue = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isScrollable, setIsScrollable] = useState(true);

  // Smooth the scroll progress so the circle fills organically
  const smoothProgress = useSpring(progressValue, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Footer avoidance: use a raw motion value so scroll events never trigger React re-renders
  const rawBottom = useMotionValue(24);
  const smoothBottom = useSpring(rawBottom, {
    stiffness: 300,
    damping: 40,
    restDelta: 0.5
  });

  useEffect(() => {
    const footer = document.querySelector('footer');

    const handleScroll = () => {
      // Footer avoidance logic
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const overlap = window.innerHeight - footerRect.top;
        rawBottom.set(overlap > 0 ? overlap + 20 : 24);
      }

      // Article progress logic
      const article = document.querySelector('article');
      if (article) {
        const rect = article.getBoundingClientRect();
        const articleTop = rect.top + window.scrollY;
        const articleHeight = rect.height;
        const articleBottom = articleTop + articleHeight;

        // Progress finishes when the bottom of the article is in view
        const maxScroll = articleBottom - window.innerHeight;
        if (maxScroll <= 0) {
          progressValue.set(1);
          setIsFinished(true);
        } else {
          const currentProgress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
          progressValue.set(currentProgress);
          setIsFinished(currentProgress >= 0.99);
        }
      } else {
        // Fallback to entire page scroll if no article element is found
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentProgress = documentHeight > 0 ? window.scrollY / documentHeight : 1;
        progressValue.set(currentProgress);
        setIsFinished(currentProgress >= 0.99);
      }
    };

    const handleResize = () => {
      handleScroll();
      setIsMobile(isMobileViewport());
      
      const article = document.querySelector('article');
      if (article) {
        const rect = article.getBoundingClientRect();
        const articleAbsoluteBottom = rect.top + window.scrollY + rect.height;
        // Require at least 50px of scrolling past the window to show the indicator
        setIsScrollable(articleAbsoluteBottom > window.innerHeight + 50);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [rawBottom, progressValue]);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showText = isMobile ? isFinished : (isHovered || isFinished);

  if (!isScrollable) return null;

  return (
    <motion.button
      onClick={handleScrollToTop}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      initial={{ opacity: 0, scale: 0.9, width: 40 }}
      animate={{
        opacity: 1,
        scale: 1,
        width: showText ? 160 : 40
      }}
      transition={{
        width: { type: "spring", stiffness: 260, damping: 26 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 }
      }}
      className={`
        fixed z-50 flex items-center justify-end lg:justify-start overflow-hidden
        right-6 lg:right-auto lg:left-[calc(50%+24rem+2rem)]
        backdrop-blur-[20px] backdrop-saturate-150
        text-charcoal font-sans text-xs uppercase tracking-widest font-bold
        cursor-pointer
      `}
      style={{
        height: '40px',
        borderRadius: '20px',
        bottom: smoothBottom,
        border: '1px solid rgba(255,255,255,0.2)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 0%)',
        boxShadow: 'inset 0 1.5px 1px rgba(255, 255, 255, 0.4), inset 0 -1px 1px rgba(0,0,0,0.05), 0 20px 60px -12px rgba(0,0,0,0.20)',
      }}
    >
      {/* "Back to Top" Text */}
      <motion.div
        initial={false}
        animate={{
          opacity: showText ? 1 : 0,
          scale: showText ? 1 : 0.95,
          x: showText ? 0 : (isMobile ? 15 : -15)
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 26,
          delay: showText ? 0.05 : 0
        }}
        className="whitespace-nowrap pl-[20px] pr-[48px] lg:pl-[48px] lg:pr-[20px]"
      >
        Back to Top
      </motion.div>

      {/* The 40x40 circle area pinned to the right on mobile, left on desktop */}
      <div
        className="absolute right-0 lg:right-auto lg:left-0 top-1/2 -translate-y-1/2 w-[40px] h-[40px] pointer-events-none"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {(isMobile && !isFinished) && (
          <ChevronUp size={16} style={{ color: 'var(--color-moss)', position: 'relative', zIndex: 1 }} />
        )}

        {/* Background track */}
        <svg
          width="40" height="40" viewBox="0 0 40 40"
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="20" cy="20" r="15"
            fill="transparent"
            stroke="rgba(51,51,51,0.08)"
            strokeWidth="2.5"
          />
        </svg>

        {/* Foreground progress ring */}
        <svg
          width="40" height="40" viewBox="0 0 40 40"
          style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}
        >
          <motion.circle
            cx="20" cy="20" r="15"
            fill="transparent"
            stroke="var(--color-moss)"
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ pathLength: smoothProgress }}
          />
        </svg>
      </div>
    </motion.button>
  );
};

export default CircularScrollIndicator;
