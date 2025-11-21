import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Poster } from '../types';
import { POSTERS as DEFAULT_POSTERS } from '../constants';

interface PosterContextType {
  posters: Poster[];
  addPoster: (poster: Omit<Poster, 'id'>) => void;
  updatePoster: (poster: Poster) => void;
  deletePoster: (id: number) => void;
}

const PosterContext = createContext<PosterContextType | undefined>(undefined);

export const PosterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [posters, setPosters] = useState<Poster[]>(() => {
    // Try to load from local storage
    const saved = localStorage.getItem('aura_posters');
    return saved ? JSON.parse(saved) : DEFAULT_POSTERS;
  });

  useEffect(() => {
    localStorage.setItem('aura_posters', JSON.stringify(posters));
  }, [posters]);

  const addPoster = (posterData: Omit<Poster, 'id'>) => {
    const newPoster = {
      ...posterData,
      id: Date.now(), // Simple ID generation
    };
    setPosters([...posters, newPoster]);
  };

  const updatePoster = (updatedPoster: Poster) => {
    setPosters(posters.map(p => p.id === updatedPoster.id ? updatedPoster : p));
  };

  const deletePoster = (id: number) => {
    setPosters(posters.filter(p => p.id !== id));
  };

  return (
    <PosterContext.Provider value={{ posters, addPoster, updatePoster, deletePoster }}>
      {children}
    </PosterContext.Provider>
  );
};

export const usePosters = () => {
  const context = useContext(PosterContext);
  if (!context) {
    throw new Error('usePosters must be used within a PosterProvider');
  }
  return context;
};