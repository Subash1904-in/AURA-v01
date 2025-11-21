import React, { useState, useCallback } from 'react';
import { getPosters, addPoster, deletePoster } from '../services/posterService';
import { Poster } from '../types';

const Admin: React.FC = () => {
  const [posters, setPosters] = useState<Poster[]>(getPosters());
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPosters = useCallback(() => {
    setPosters(getPosters());
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('File is too large. Please upload an image under 5MB.');
        return;
    }

    setError(null);
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      addPoster(reader.result as string);
      refreshPosters();
      setUploading(false);
    };
    reader.onerror = () => {
        setError('Failed to read file.');
        setUploading(false);
    }
    reader.readAsDataURL(file);
    event.target.value = ''; // Reset file input
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this poster?')) {
      deletePoster(id);
      refreshPosters();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Admin - Manage Posters</h1>
            <a href="/#/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-semibold transition-colors">
                Back to Assistant
            </a>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-3">Upload New Poster</h2>
            <p className="text-gray-400 text-sm mb-4">Select an image file (PNG, JPG, WEBP) to add to the carousel. Max file size: 5MB.</p>
            <input
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                disabled={uploading}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {uploading && <p className="text-blue-400 mt-2">Uploading...</p>}
            {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>

        <div>
            <h2 className="text-xl font-semibold mb-4">Current Posters</h2>
            {posters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {posters.map(poster => (
                        <div key={poster.id} className="relative group bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                            <img src={poster.dataUrl} alt="Poster" className="w-full h-48 object-cover"/>
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => handleDelete(poster.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400 text-center py-8">No posters have been uploaded yet.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
