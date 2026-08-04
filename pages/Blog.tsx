
import React, { useState, useEffect } from 'react';
import { motion as motionComponent, AnimatePresence } from 'framer-motion';
import * as ReactRouterDOM from 'react-router-dom';
import { BLOG_POSTS, isMobileViewport } from '../constants';
import { ArrowRight } from 'lucide-react';

const { Link } = ReactRouterDOM as any;
const motion = motionComponent as any;

const Blog: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Detect mobile viewport (see MOBILE_MAX in constants)
  useEffect(() => {
    const checkMobile = () => setIsMobile(isMobileViewport());
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const categories = ['All', ...Array.from(new Set(BLOG_POSTS.map(p => p.category)))];

  const filteredPosts = activeFilter === 'All'
    ? BLOG_POSTS
    : BLOG_POSTS.filter(p => p.category === activeFilter);

  const handleArticleInteraction = (postId: string) => {
    if (isMobile) {
      // Toggle on tap for mobile
      setExpandedId(expandedId === postId ? null : postId);
    }
  };

  const handleMouseEnter = (postId: string) => {
    if (!isMobile) {
      setExpandedId(postId);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setExpandedId(null);
    }
  };

  const isExpanded = (postId: string) => expandedId === postId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-32 pb-24 px-6 md:px-12 min-h-screen bg-[#F5F4F0]"
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER: Grid-Aligned */}
        <header className="grid grid-cols-12 gap-6 mb-16">
          <div className="col-span-12 md:col-span-3">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-charcoal/40">
              Journal
            </span>
          </div>
          <div className="col-span-12 md:col-span-9">
            <h1 className="font-serif text-5xl md:text-7xl text-charcoal leading-none mb-6">
              Writings
            </h1>
            <p className="text-lg text-charcoal/50 leading-relaxed max-w-2xl font-sans">
              You can also find more of my writings at{' '}
              <a
                href="https://substack.com/@adityavishwakarma1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-moss hover:text-moss-light underline decoration-moss/30 hover:decoration-moss transition-all"
              >
                my substack.
              </a>
            </p>
          </div>
        </header>

        {/* FILTER BAR: Horizontal, Minimal */}
        <div className="grid grid-cols-12 gap-6 mb-16 border-b border-charcoal/10 pb-4">
          <div className="col-span-12 md:col-span-3" /> {/* Spacer for grid alignment */}
          <div className="col-span-12 md:col-span-9 flex gap-6 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-250 ease-out ${activeFilter === cat
                  ? 'text-charcoal'
                  : 'text-charcoal/40 hover:text-charcoal/70'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ARTICLE LIST: FLIP Animated */}
        <div className="flex flex-col">
          <AnimatePresence mode="popLayout">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.05 }}
              >
                {/* DESKTOP VERSION */}
                <article
                  onMouseEnter={() => handleMouseEnter(post.id)}
                  onMouseLeave={handleMouseLeave}
                  className="hidden md:block rounded-lg -mx-4 px-4 py-8 border-b border-charcoal/10 last:border-b-0 cursor-pointer"
                  style={{
                    backgroundColor: isExpanded(post.id) ? 'rgba(46, 79, 10, 0.03)' : 'transparent',
                    boxShadow: isExpanded(post.id)
                      ? '0 8px 32px -8px rgba(46, 79, 10, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.04)'
                      : '0 0 0 0 transparent',
                    transition: 'background-color 300ms cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 300ms cubic-bezier(0.25, 0.1, 0.25, 1)'
                  }}
                >
                  <Link
                    to={post.path}
                    className="flex items-center justify-between gap-6"
                  >
                    <div className="shrink-0 w-1/4">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-charcoal/40 font-bold block">
                        {post.date}
                      </span>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-moss font-bold mt-1 block">
                        {post.category}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <motion.h2
                        className="font-serif text-3xl md:text-4xl text-charcoal leading-snug"
                        animate={{ x: isExpanded(post.id) ? 4 : 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        {post.title}
                      </motion.h2>

                      <AnimatePresence>
                        {isExpanded(post.id) && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            className="text-base text-charcoal/80 leading-relaxed overflow-hidden font-sans"
                          >
                            {post.excerpt}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="shrink-0 w-8 flex items-center justify-center">
                      <AnimatePresence>
                        {isExpanded(post.id) && (
                          <motion.span
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                            className="text-moss"
                          >
                            <ArrowRight size={24} strokeWidth={1.5} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </Link>
                </article>

                {/* MOBILE VERSION */}
                <article className="md:hidden relative p-8 rounded-3xl bg-[#FBFAF5] border border-charcoal/10 mb-6 transition-transform duration-300 active:scale-[0.98]">
                  <Link to={post.path} className="flex flex-col w-full h-full">
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-moss/60 font-medium mb-4 block">
                        {post.category}
                      </span>
                      <h3 className="font-serif text-2xl text-charcoal mb-3 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-charcoal/50 text-[15px] leading-relaxed line-clamp-3 font-sans">
                        {post.excerpt}
                      </p>
                    </div>
                    <div className="flex justify-end w-full mt-4">
                      <ArrowRight strokeWidth={1.5} size={24} className="text-moss" />
                    </div>
                  </Link>
                </article>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Blog;
