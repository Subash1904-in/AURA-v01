import React from 'react';
import { motion, Variants } from 'framer-motion';
import { VoiceState } from '../types';

interface VoiceVisualizerProps {
  state: VoiceState;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ state }) => {
  // Colors for the orb layers
  const colors = {
    core: state === VoiceState.ERROR ? "rgba(255, 50, 50, 0.9)" : "rgba(255, 255, 255, 0.9)",
    inner: state === VoiceState.ERROR ? "rgba(255, 0, 0, 0.6)" : "rgba(100, 200, 255, 0.6)", 
    middle: state === VoiceState.ERROR ? "rgba(200, 0, 0, 0.5)" : "rgba(180, 100, 255, 0.5)", 
    outer: state === VoiceState.ERROR ? "rgba(150, 0, 0, 0.4)" : "rgba(255, 100, 150, 0.4)", 
  };

  // Animation variants based on state
  const containerVariants: Variants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1, transition: { duration: 0.5 } },
    exit: { scale: 0.8, opacity: 0 },
  };

  const blobVariants: Variants = {
    [VoiceState.LISTENING]: {
      scale: [1, 1.1, 1],
      rotate: [0, 120, 240, 360],
      x: [0, 10, -10, 0],
      y: [0, -10, 10, 0],
      transition: {
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
      }
    },
    [VoiceState.THINKING]: {
      scale: [1, 0.8, 1.2, 1],
      rotate: [0, 360],
      transition: {
        duration: 1.5,
        ease: "linear",
        repeat: Infinity,
      }
    },
    [VoiceState.SPEAKING]: {
      scale: [1, 1.3, 0.9, 1.4, 1],
      transition: {
        duration: 0.8,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      }
    },
    [VoiceState.ERROR]: {
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.8, 0.5],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-64 h-64 flex items-center justify-center"
    >
      {/* Ambient Glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl"
        style={{ background: `conic-gradient(from 0deg, ${colors.outer}, ${colors.middle}, ${colors.inner}, ${colors.outer})` }}
        animate={state === VoiceState.ERROR ? { opacity: 0.5, rotate: 0 } : { rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Layer 1: Outer Blob */}
      <motion.div
        className="absolute w-48 h-48 rounded-full blur-xl mix-blend-screen"
        style={{ backgroundColor: colors.outer }}
        variants={blobVariants}
        animate={state}
      />

      {/* Layer 2: Middle Blob */}
      <motion.div
        className="absolute w-40 h-40 rounded-full blur-lg mix-blend-screen"
        style={{ backgroundColor: colors.middle }}
        variants={blobVariants}
        animate={state}
        transition={{ delay: 0.1 }} // Stagger
      />

      {/* Layer 3: Inner Blob */}
      <motion.div
        className="absolute w-32 h-32 rounded-full blur-md mix-blend-screen"
        style={{ backgroundColor: colors.inner }}
        variants={blobVariants}
        animate={state}
        transition={{ delay: 0.2 }}
      />

      {/* Core */}
      <motion.div
        className="absolute w-16 h-16 bg-white rounded-full blur-sm shadow-[0_0_40px_rgba(255,255,255,0.8)]"
        animate={state === VoiceState.SPEAKING ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.4, repeat: Infinity }}
      />
    </motion.div>
  );
};