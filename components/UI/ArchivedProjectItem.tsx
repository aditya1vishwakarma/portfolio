import React, { useState, useEffect } from 'react';
import { motion as motionComponent, AnimatePresence } from 'framer-motion';
import * as ReactRouterDOM from 'react-router-dom';
import { Project } from '../../types';
import { isMobileViewport } from '../../constants';
import { ArrowRight } from 'lucide-react';

const { Link } = ReactRouterDOM as any;
const motion = motionComponent as any;

interface ArchivedProjectItemProps {
    project: Project;
}

const ArchivedProjectItem: React.FC<ArchivedProjectItemProps> = ({ project }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    // Detect mobile viewport (see MOBILE_MAX in constants)
    useEffect(() => {
        const checkMobile = () => setIsMobile(isMobileViewport());
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleInteraction = (e: React.MouseEvent) => {
        if (isMobile) {
            if (!isExpanded) {
                e.preventDefault();
                setIsExpanded(true);
            } else {
                setIsExpanded(false);
            }
        }
    };

    const handleMouseEnter = () => {
        if (!isMobile) {
            setIsExpanded(true);
        }
    };

    const handleMouseLeave = () => {
        if (!isMobile) {
            setIsExpanded(false);
        }
    };

    return (
        <motion.div layout className="mb-0 md:mb-0">
            {/* DESKTOP VERSION */}
            <article
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="hidden md:block rounded-lg -mx-4 px-4 py-8 border-b border-charcoal/10 last:border-b-0 cursor-pointer"
                style={{
                    backgroundColor: isExpanded ? 'rgba(46, 79, 10, 0.03)' : 'transparent',
                    boxShadow: isExpanded
                        ? '0 8px 32px -8px rgba(46, 79, 10, 0.12), 0 4px 16px -4px rgba(0, 0, 0, 0.04)'
                        : '0 0 0 0 transparent',
                    transition: 'background-color 300ms cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 300ms cubic-bezier(0.25, 0.1, 0.25, 1)'
                }}
            >
                <Link
                    to={project.path}
                    className="flex items-center justify-between gap-6"
                >
                    {/* LEFT: Metadata */}
                    <div className="shrink-0 w-1/4">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-charcoal/40 font-bold block">
                            {project.date}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-moss font-bold mt-1 block">
                            {project.category}
                        </span>
                    </div>

                    {/* CENTER: Title + Blooming Description */}
                    <div className="flex-1 min-w-0">
                        <motion.h2
                            className="font-serif text-3xl md:text-4xl text-charcoal leading-snug"
                            animate={{ x: isExpanded ? 4 : 0 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                        >
                            {project.title}
                        </motion.h2>

                        {/* Static Description */}
                        <p className="text-base text-charcoal/80 leading-relaxed font-sans mt-4">
                            {project.description}
                        </p>
                    </div>

                    {/* RIGHT: Centered Arrow */}
                    <div className="shrink-0 w-8 flex items-center justify-center">
                        <AnimatePresence>
                            {isExpanded && (
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
                <Link to={project.path} className="flex flex-col w-full h-full">
                    <div>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-moss/60 font-medium mb-4 block">
                            {project.category}
                        </span>
                        <h3 className="font-serif text-2xl text-charcoal mb-3 leading-tight">
                            {project.title}
                        </h3>
                        <p className="text-charcoal/50 text-[15px] leading-relaxed line-clamp-3 font-sans">
                            {project.description}
                        </p>
                    </div>
                    <div className="flex justify-end w-full mt-4">
                        <ArrowRight strokeWidth={1.5} size={24} className="text-moss" />
                    </div>
                </Link>
            </article>
        </motion.div>
    );
};

export default ArchivedProjectItem;
