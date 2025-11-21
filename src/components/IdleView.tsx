import React, { useState } from 'react';
import PosterCarousel from './PosterCarousel';
import { getPosters } from '../services/posterService';

// The IdleView component is now purely presentational.
// Face detection has been moved to a dedicated UserDetector component.
const IdleView: React.FC = () => {
  const [posters] = useState(getPosters());

  return (
    <div className="w-screen h-screen bg-gray-900">
      <PosterCarousel posters={posters} />
    </div>
  );
};

export default IdleView;
