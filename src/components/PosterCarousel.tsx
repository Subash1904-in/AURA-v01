import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { SPRING_PRIMARY } from '../constants';
import { usePosters } from '../contexts/PosterContext';

export const PosterCarousel: React.FC = () => {
  const { posters } = usePosters();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (posters.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % posters.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [posters.length]);

  const variants: Variants = {
    enter: (direction: number) => ({
      x: 100,
      opacity: 0,
      scale: 0.9,
      rotateY: 15,
      zIndex: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        ...SPRING_PRIMARY,
        delay: 0.1 // Slight delay for depth feel
      }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: -100,
      opacity: 0,
      scale: 0.9,
      rotateY: -15,
      transition: {
        ...SPRING_PRIMARY,
        duration: 0.4 
      }
    })
  };

  if (posters.length === 0) {
    return (
        <div className="flex items-center justify-center h-full text-white/50">
            No posters configured.
        </div>
    )
  }

  // Safely get current poster even if index is out of bounds momentarily
  const currentPoster = posters[index % posters.length];

  return (
    <div className="relative w-full h-full flex items-center justify-center perspective-1000">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={currentPoster.id}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute w-[400px] h-[600px] rounded-[40px] overflow-hidden shadow-2xl"
          style={{ perspective: 1000 }}
        >
          <div className="w-full h-full relative">
            <img 
              src={currentPoster.imageUrl} 
              alt={currentPoster.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-12 left-8 right-8">
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, ...SPRING_PRIMARY }}
                className="text-5xl font-bold text-white tracking-tight mb-2"
              >
                {currentPoster.title}
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 0.8 }}
                transition={{ delay: 0.4, ...SPRING_PRIMARY }}
                className="text-xl text-white font-medium"
              >
                {currentPoster.subtitle}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};