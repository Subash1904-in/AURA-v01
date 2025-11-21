import { Poster } from '../types';

const STORAGE_KEY = 'kssem-assistant-posters';

export const getPosters = (): Poster[] => {
  try {
    const postersJSON = localStorage.getItem(STORAGE_KEY);
    return postersJSON ? JSON.parse(postersJSON) : [];
  } catch (error) {
    console.error('Failed to parse posters from localStorage', error);
    return [];
  }
};

export const addPoster = (dataUrl: string): Poster => {
  const posters = getPosters();
  const newPoster: Poster = {
    id: `poster-${Date.now()}`,
    dataUrl,
  };
  const updatedPosters = [...posters, newPoster];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosters));
  return newPoster;
};

export const deletePoster = (id: string): void => {
  const posters = getPosters();
  const updatedPosters = posters.filter(poster => poster.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPosters));
};
