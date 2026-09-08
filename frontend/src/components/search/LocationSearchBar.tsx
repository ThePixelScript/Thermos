/**
 * THERMOS Geospatial Platform — Google Maps Style Location Search Bar
 *
 * Capabilities:
 * - Search any city, town, district, ward, zip code, landmark, or lat/lon globally
 * - 300ms debounce
 * - Autocomplete dropdown with keyboard navigation (Up, Down, Enter, Escape)
 * - Clear button
 * - Loading indicator
 * - Empty & error states
 * - Recent searches history dropdown (persisted up to 10 in localStorage)
 * - Seamless integration with LocationContext & MapLibre camera flyTo
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, History, X, Loader2, Compass, Trash2 } from 'lucide-react';
import { useLocation } from '../../context/LocationContext';
import { searchLocations } from '../../services/api';
import type { LocationSearchResult, SelectedLocation } from '../../types';

export interface LocationSearchBarProps {
  onLocationSelect?: (location: SelectedLocation) => void;
  className?: string;
  placeholder?: string;
}

export const LocationSearchBar: React.FC<LocationSearchBarProps> = ({
  onLocationSelect,
  className = '',
  placeholder = 'Search city, landmark, coordinates (e.g. 13.08, 80.27)...',
}) => {
  const {
    selectedLocation,
    setSelectedLocation,
    recentSearches,
    clearRecentSearches,
    isResolving,
  } = useLocation();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse direct coordinate input: "13.0827, 80.2707"
  const parseCoordinates = (text: string): { lat: number; lon: number } | null => {
    const trimmed = text.trim();
    const match = trimmed.match(/^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)[,\s]+[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/);
    if (match) {
      const parts = trimmed.split(/[\s,]+/).filter(Boolean);
      if (parts.length >= 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          return { lat, lon };
        }
      }
    }
    return null;
  };

  const handleSelect = useCallback(
    (loc: SelectedLocation) => {
      setSelectedLocation(loc);
      setQuery(loc.name || loc.display_name.split(',')[0]);
      setIsOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
      if (onLocationSelect) {
        onLocationSelect(loc);
      }
    },
    [setSelectedLocation, onLocationSelect]
  );

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Check if directly typing coordinates
    const coords = parseCoordinates(trimmed);
    if (coords) {
      setSuggestions([
        {
          name: `Coordinates (${coords.lat.toFixed(4)}°, ${coords.lon.toFixed(4)}°)`,
          display_name: `Jump directly to coordinate ${coords.lat}, ${coords.lon}`,
          lat: coords.lat,
          lon: coords.lon,
          type: 'coordinate',
          category: 'direct_input',
          source: 'User Input',
        },
      ]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchLocations(trimmed);
        setSuggestions(results);
        setError(null);
      } catch (err: any) {
        console.warn('Location search error:', err);
        setError('Location search currently unavailable');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalItems = query.trim() ? suggestions.length : recentSearches.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const coords = parseCoordinates(query);
      if (coords) {
        // Resolve directly
        const loc: SelectedLocation = {
          name: `Lat: ${coords.lat.toFixed(4)}, Lon: ${coords.lon.toFixed(4)}`,
          display_name: `Coordinates: ${coords.lat}, ${coords.lon}`,
          lat: coords.lat,
          lon: coords.lon,
          source: 'Coordinate Input',
        };
        handleSelect(loc);
        return;
      }

      if (isOpen && activeIndex >= 0) {
        if (query.trim() && suggestions[activeIndex]) {
          const item = suggestions[activeIndex];
          handleSelect({
            name: item.name,
            display_name: item.display_name,
            lat: item.lat,
            lon: item.lon,
            bbox: item.bbox,
            source: item.source || 'Search Autocomplete',
          });
        } else if (!query.trim() && recentSearches[activeIndex]) {
          handleSelect(recentSearches[activeIndex]);
        }
      } else if (suggestions.length > 0) {
        const item = suggestions[0];
        handleSelect({
          name: item.name,
          display_name: item.display_name,
          lat: item.lat,
          lon: item.lon,
          bbox: item.bbox,
          source: item.source || 'Search Autocomplete',
        });
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearInput = () => {
    setQuery('');
    setSuggestions([]);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const showRecents = !query.trim() && recentSearches.length > 0 && isOpen;
  const showSuggestions = !!query.trim() && isOpen;

  return (
    <div ref={containerRef} className={`location-search-container ${className}`}>
      <div className="location-search-bar">
        <span className="search-icon-wrapper">
          {loading || isResolving ? (
            <Loader2 className="search-spinner animate-spin" size={16} />
          ) : (
            <Search size={16} className="search-icon" />
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="location-search-input"
          aria-label="Search Global Location"
          autoComplete="off"
          spellCheck={false}
        />

        {query && (
          <button
            type="button"
            onClick={clearInput}
            className="search-clear-btn"
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}

        {selectedLocation && (
          <div className="current-location-pill" title={`Active Target: ${selectedLocation.display_name}`}>
            <MapPin size={12} className="pill-pin" />
            <span className="pill-name">{selectedLocation.name || 'Selected'}</span>
          </div>
        )}
      </div>

      {/* Autocomplete / Recents Dropdown */}
      {isOpen && (
        <div className="location-dropdown">
          {/* Active Suggestions */}
          {showSuggestions && (
            <div className="dropdown-section">
              {suggestions.length > 0 ? (
                <ul className="dropdown-list">
                  {suggestions.map((item, idx) => {
                    const isSelected = idx === activeIndex;
                    return (
                      <li
                        key={`${item.lat}-${item.lon}-${idx}`}
                        className={`dropdown-item ${isSelected ? 'active' : ''}`}
                        onClick={() =>
                          handleSelect({
                            name: item.name,
                            display_name: item.display_name,
                            lat: item.lat,
                            lon: item.lon,
                            bbox: item.bbox,
                            source: item.source || 'Search Autocomplete',
                          })
                        }
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="item-icon-wrapper">
                          {item.type === 'coordinate' ? (
                            <Compass size={15} className="item-icon coordinate" />
                          ) : (
                            <MapPin size={15} className="item-icon" />
                          )}
                        </span>
                        <div className="item-info">
                          <span className="item-primary">{item.name || item.display_name.split(',')[0]}</span>
                          <span className="item-secondary">{item.display_name}</span>
                        </div>
                        <span className="item-coords">
                          {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : !loading ? (
                <div className="dropdown-empty">
                  {error ? (
                    <span className="error-text">{error}</span>
                  ) : (
                    <span>No locations found matching "{query}"</span>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Recent Searches */}
          {showRecents && (
            <div className="dropdown-section recents-section">
              <div className="section-header">
                <span className="section-title">
                  <History size={13} className="mr-1 inline" /> Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="btn-clear-history"
                  title="Clear all recent locations"
                >
                  <Trash2 size={11} className="mr-1 inline" /> Clear
                </button>
              </div>
              <ul className="dropdown-list">
                {recentSearches.map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <li
                      key={`recent-${item.lat}-${item.lon}-${idx}`}
                      className={`dropdown-item ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setActiveIndex(idx)}
                    >
                      <span className="item-icon-wrapper">
                        <History size={15} className="item-icon history" />
                      </span>
                      <div className="item-info">
                        <span className="item-primary">{item.name || item.display_name.split(',')[0]}</span>
                        <span className="item-secondary">{item.display_name}</span>
                      </div>
                      <span className="item-coords">
                        {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearchBar;
