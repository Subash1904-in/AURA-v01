// Apple Spring Physics Configuration
export const SPRING_PRIMARY = {
  type: "spring" as const,
  stiffness: 360,
  damping: 32,
  mass: 1,
};

export const SPRING_SECONDARY = {
  type: "spring" as const,
  stiffness: 280,
  damping: 28,
  mass: 0.8,
};

export const SPRING_BREATHE = {
  type: "spring" as const,
  stiffness: 80,
  damping: 16,
  repeat: Infinity,
  repeatType: "reverse" as const,
};

export const POSTERS = [
  { id: 1, imageUrl: 'https://picsum.photos/800/1200?random=1', title: 'Explore', subtitle: 'Discover the unknown' },
  { id: 2, imageUrl: 'https://picsum.photos/800/1200?random=2', title: 'Create', subtitle: 'Design your future' },
  { id: 3, imageUrl: 'https://picsum.photos/800/1200?random=3', title: 'Connect', subtitle: 'Bridge the gap' },
  { id: 4, imageUrl: 'https://picsum.photos/800/1200?random=4', title: 'Inspire', subtitle: 'Ignite the spark' },
];

export const GEMINI_MODEL = 'gemini-2.5-flash';