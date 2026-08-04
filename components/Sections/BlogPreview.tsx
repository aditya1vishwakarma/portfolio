
import React from 'react';
import { motion as motionComponent } from 'framer-motion';
import * as ReactRouterDOM from 'react-router-dom';
import { BLOG_POSTS } from '../../constants';
import { ArrowRight } from 'lucide-react';

const { Link } = ReactRouterDOM as any;
const motion = motionComponent as any;

const BlogPreview: React.FC = () => {
  return (
    <section className="py-32 bg-[#F5F4F0]">
      <div className="px-6 md:px-12 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-20">
          <h2 className="font-serif text-5xl md:text-7xl text-charcoal tracking-tight">Writings</h2>
          <p className="mt-6 text-charcoal/60 max-w-md text-lg leading-relaxed">
            Thoughts on life, design, art, music, etc. This section is still under construction!
          </p>
        </div>
        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS.slice(0, 3).map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 1, ease: [0.25, 0.1, 0.25, 1.0] }}
            >
              <Link to={post.path} className="block group h-full">
                <article
                  className="relative flex flex-col justify-between h-full min-h-[17.5rem] p-8 rounded-3xl bg-white border border-transparent transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] group-hover:scale-[1.02] group-hover:border-moss/30"
                >
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-moss/60 font-medium mb-4 block">
                      {post.category}
                    </span>

                    <h3 className="font-serif text-2xl text-charcoal mb-3 leading-tight group-hover:text-black transition-colors">
                      {post.title}
                    </h3>

                    <p className="text-charcoal/50 text-[15px] leading-relaxed line-clamp-3 font-sans">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="absolute bottom-8 right-8 overflow-hidden">
                    <div className="transform transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0">
                      <ArrowRight strokeWidth={1.5} size={24} className="text-moss" />
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* View All - Strictly right-aligned to grid */}
        <div className="flex justify-end mt-12 border-t border-charcoal/5 pt-8">
          <Link
            to="/blog"
            className="group inline-flex items-center gap-2 text-charcoal/80 hover:text-moss transition-colors duration-300 font-medium uppercase tracking-widest text-xs"
          >
            View All Posts
            <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
