import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePosters } from '../contexts/PosterContext';
import { Poster } from '../types';
import { SPRING_PRIMARY } from '../constants';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { posters, addPoster, updatePoster, deletePoster } = usePosters();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Omit<Poster, 'id'>>({
    title: '',
    subtitle: '',
    imageUrl: '',
  });

  const resetForm = () => {
    setFormData({ title: '', subtitle: '', imageUrl: '' });
    setEditingId(null);
  };

  const handleEdit = (poster: Poster) => {
    setEditingId(poster.id);
    setFormData({
      title: poster.title,
      subtitle: poster.subtitle,
      imageUrl: poster.imageUrl,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updatePoster({ ...formData, id: editingId });
    } else {
      addPoster(formData);
    }
    resetForm();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full h-full flex flex-col p-8 z-50 bg-black/40 backdrop-blur-2xl overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Content Management</h1>
            <p className="text-white/50 text-sm mt-1">Manage Kiosk Idle Posters</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors border border-white/5"
          >
            Exit Admin
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-3xl sticky top-8">
              <h2 className="text-xl font-semibold mb-4 text-white">
                {editingId ? 'Edit Poster' : 'Add New Poster'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all"
                    placeholder="e.g., Explore"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Subtitle</label>
                  <input
                    type="text"
                    required
                    value={formData.subtitle}
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 transition-all"
                    placeholder="e.g., Discover the unknown"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Image URL</label>
                  <input
                    type="url"
                    required
                    value={formData.imageUrl}
                    onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 transition-all"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-white/40 mb-1">Or Upload Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                            alert('File is too large. Please upload an image under 5MB.');
                            return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-white/40 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                  />
                </div>
                
                {/* Preview Mini */}
                {formData.imageUrl && (
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-white/10 mt-2">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')}/>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-white/90 transition-colors shadow-lg shadow-white/10"
                  >
                    {editingId ? 'Save Changes' : 'Add Poster'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posters.map((poster) => (
              <motion.div
                layoutId={`poster-${poster.id}`}
                key={poster.id}
                className="group relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-white/30 transition-colors"
              >
                <img
                  src={poster.imageUrl}
                  alt={poster.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-xl font-bold text-white">{poster.title}</h3>
                  <p className="text-sm text-white/70">{poster.subtitle}</p>
                  
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                    <button
                      onClick={() => handleEdit(poster)}
                      className="flex-1 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-xs font-bold uppercase tracking-wider"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePoster(poster.id)}
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md text-red-200 rounded-lg text-xs font-bold uppercase tracking-wider"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {posters.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-white/10 rounded-2xl text-white/30">
                <p>No posters available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};