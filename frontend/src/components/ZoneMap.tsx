/**
 * ZoneMap — Backward-compatible wrapper delegating directly to ThermosMap.
 * 
 * Removes all static/mock SVG fallbacks in favor of the production
 * MapLibre GL architecture with LayerManager.
 */
import React from 'react';
import { ThermosMap, type ThermosMapProps } from './map/ThermosMap';

export type ZoneMapProps = ThermosMapProps;

export const ZoneMap: React.FC<ZoneMapProps> = (props) => {
  return <ThermosMap {...props} />;
};

export default ZoneMap;
