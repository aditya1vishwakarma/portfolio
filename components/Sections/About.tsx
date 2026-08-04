
import React from 'react';
import { motion as motionComponent } from 'framer-motion';
import * as ReactRouterDOM from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Fix: Cast imports to any to resolve environment-specific type errors
const { Link } = ReactRouterDOM as any;
const motion = motionComponent as any;

const About: React.FC = () => {
  return (
    <section id="about" className="py-32 px-6 md:px-12 bg-[#F5F4F0]">
      <div className="max-w-7xl mx-auto">

        {/* Header / Intro Section */}
        <div className="mb-12 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-serif text-5xl md:text-7xl text-charcoal mb-6 leading-none tracking-tight">
              About <span className="text-[#3F6D0D] font-serif font-normal tracking-[-0.02em]">Aditya</span>
            </h2>
            <p className="text-lg md:text-lg leading-relaxed text-charcoal/80 max-w-3xl font-sans">
              I'm a Bay Area native who grew up in Cupertino. Currently an APM helping marketing teams scale growth via digital platforms. <br />My goal in life is to make products that real people use, and help the world be a more beautiful and intentional place.
            </p>
          </motion.div>
        </div>

        {/* Structural Keyline */}
        <div className="w-full h-[1px] bg-charcoal/10 mb-10" />

        {/* Unboxed 3-Column Grid */}
        {/* Two columns through the tablet range — three at 214px each leaves ~19
            characters per line once p-8 is subtracted, which reads as a word ladder. */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 items-stretch">
          {[
            {
              title: "My approach to the \"what\"",
              content: "Solve the user's problem. Find the signal in the noise, define the product's core issue. and ensuring every design decision is in service of a singular, impactful user experience.",
              isInteractive: false
            },
            {
              title: "My approach to the \"how\"",
              content: "Bridge the gap of user experience with human intuition as guidance and data as my backup. The final output has to be a natural evolution that is as functional as it is beautiful.",
              isInteractive: false
            },
            {
              title: "Mood Board",
              content: "A collection of artifacts, interfaces, and projects that define my aesthetic and standards. Curated inspiration.",
              isInteractive: true,
              path: "/moodboard"
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.8 }}
              className={`h-full ${item.isInteractive ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              {/* Conditional Wrapper: Link vs Div */}
              {item.isInteractive ? (
                <Link to={item.path} className="block group h-full">
                  {/* Tablet shows two columns, so this card spans the full row and
                      reflows into a horizontal band — title, copy, arrow on one line —
                      instead of standing tall beside an empty cell. Reverts at lg. */}
                  <div className="relative p-8 rounded-3xl transition-colors duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] group-hover:bg-[#3F6D0D]/5 h-full flex flex-col justify-between md:flex-row md:items-center md:gap-8 lg:flex-col lg:items-stretch lg:gap-0">
                    {/* Content Container */}
                    <div className="relative z-10 md:flex md:flex-1 md:items-baseline md:gap-6 lg:block">
                      <h3 className="font-serif text-2xl text-[#3F6D0D] mb-4 md:mb-0 md:shrink-0 lg:mb-4">
                        {item.title}
                      </h3>
                      <p className="text-charcoal/60 text-base leading-loose font-sans mb-8 md:mb-0 md:leading-relaxed lg:mb-8 lg:leading-loose">
                        {item.content}
                      </p>
                    </div>

                    {/* Animated Arrow Glyph - Bottom Right of the CARD */}
                    <div className="flex justify-end items-end p-2 md:p-0 md:shrink-0">
                      <span className="text-[#3F6D0D] transform transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0">
                        <ArrowRight size={24} strokeWidth={1.5} />
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                // Static Column - Using EXACT SAME padding structure for Geometric Sanity
                <div className="p-8 border border-transparent h-full">
                  <h3 className="font-serif text-2xl text-charcoal mb-4">
                    {item.title}
                  </h3>
                  <p className="text-charcoal/60 text-base leading-loose font-sans">
                    {item.content}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
