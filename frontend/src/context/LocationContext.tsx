/**
 * THERMOS Geospatial Platform — Location Intelligence Context
 *
 * Central state management for:
 * - Selected active location anywhere on Earth (lat, lon, bounding box, place name)
 * - Persisted recent search history in localStorage (max 10 entries)
 * - Map click selection synchronization
 * - Dynamic data re-synchronization across weather, CHRI, hotspots, and simulation
 */
import React, { createContext, useContext, useState } from 'react';
import type { SelectedLocation } from '../types';

export interface LocationContextType {
  selectedLocation: SelectedLocation;
  setSelectedLocation: (location: SelectedLocation) => void;
  recentSearches: SelectedLocation[];
  addRecentSearch: (location: SelectedLocation) => void;
  clearRecentSearches: () => void;
  isResolving: boolean;
  setIsResolving: (isResolving: boolean) => void;
}

export const DEFAULT_GLOBAL_LOCATION: SelectedLocation = {
  name: 'Chennai',
  display_name: 'Chennai, Tamil Nadu, India',
  lat: 13.0827,
  lon: 80.2707,
  bbox: [12.90, 13.25, 80.12, 80.35],
  source: 'Municipal Baseline',
};

const STORAGE_KEY_SELECTED = 'thermos_selected_location';
const STORAGE_KEY_RECENTS = 'recentLocations';
const MAX_RECENTS = 10;

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLocation, setSelectedLocationState] = useState<SelectedLocation>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_GLOBAL_LOCATION;
  });

  const [recentSearches, setRecentSearches] = useState<SelectedLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_RECENTS);
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [isResolving, setIsResolving] = useState<boolean>(false);

  const addRecentSearch = (location: SelectedLocation) => {
    setRecentSearches((prev) => {
      // De-duplicate within ~500m proximity
      const filtered = prev.filter(
        (item) =>
          Math.abs(item.lat - location.lat) > 0.005 ||
          Math.abs(item.lon - location.lon) > 0.005
      );
      const updated = [location, ...filtered].slice(0, MAX_RECENTS);
      try {
        localStorage.setItem(STORAGE_KEY_RECENTS, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to persist recent locations:', err);
      }
      return updated;
    });
  };

  const setSelectedLocation = (location: SelectedLocation) => {
    setSelectedLocationState(location);
    addRecentSearch(location);
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, JSON.stringify(location));
    } catch (err) {
      console.warn('Failed to save selected location:', err);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY_RECENTS);
    } catch (err) {
      console.warn('Failed to clear recent locations:', err);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        selectedLocation,
        setSelectedLocation,
        recentSearches,
        addRecentSearch,
        clearRecentSearches,
        isResolving,
        setIsResolving,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
