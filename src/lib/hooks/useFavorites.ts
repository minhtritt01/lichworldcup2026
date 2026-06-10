'use client';

import { useState, useEffect } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const saved = window.localStorage.getItem('fav_teams');
        if (!saved) {
          setFavorites([]);
          return;
        }

        const parsed = JSON.parse(saved);
        setFavorites(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
      } catch {
        setFavorites([]);
      }
    };

    loadFavorites();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'fav_teams') loadFavorites();
    };

    const handleCustomSync = () => loadFavorites();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('favorites-updated', handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('favorites-updated', handleCustomSync);
    };
  }, []);

  const toggleFavorite = (slug: string) => {
    const updated = favorites.includes(slug)
      ? favorites.filter(s => s !== slug)
      : [...favorites, slug];
    setFavorites(updated);
    try {
      window.localStorage.setItem('fav_teams', JSON.stringify(updated));
    } catch {
      // Ignore storage failures.
    }

    window.dispatchEvent(new Event('favorites-updated'));
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite: (slug: string) => favorites.includes(slug),
  };
}
