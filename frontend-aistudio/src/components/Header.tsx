import React from 'react';
import { 
  Thermometer, 
  MapPin, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Info,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Zone, NavigationTab } from '../types';

interface HeaderProps {
  title: string;
  subtitle: string;
  activeTab: NavigationTab;
  zones: Zone[];
  selectedZone: Zone;
  onSelectZone: (zone: Zone) => void;
  onNavigate: (tab: NavigationTab) => void;
  selectedInterventionsCount: number;
  totalCostLakhs: number;
  backendStatus?: 'connected' | 'checking' | 'error';
  backendError?: string | null;
  onRetryConnect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  activeTab,
  zones,
  selectedZone,
  onSelectZone,
  onNavigate,
  selectedInterventionsCount,
  totalCostLakhs,
  backendStatus = 'checking',
  backendError,
  onRetryConnect
}) => {
  return (
    <header 
      id="main-app-header"
      className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 flex-shrink-0 z-20 shadow-xs"
    >
      {/* Title & Subtitle */}
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="font-heading font-extrabold text-lg md:text-xl text-slate-900 tracking-tight uppercase">
            {title}
          </h1>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono-data bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
            METRO-NORTH GRID
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* Quick Access Actions */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Backend Connectivity Status Indicator */}
        <div 
          id="backend-connection-status"
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            backendStatus === 'connected'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : backendStatus === 'checking'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
          title={backendError || (backendStatus === 'connected' ? 'Connected to FastAPI backend on port 8000' : 'Checking connection...')}
        >
          <span className={`w-2 h-2 rounded-full ${
            backendStatus === 'connected'
              ? 'bg-emerald-500 animate-pulse'
              : backendStatus === 'checking'
              ? 'bg-amber-500 animate-ping'
              : 'bg-red-500'
          }`} />
          <span className="font-semibold">
            {backendStatus === 'connected' && 'Backend Live'}
            {backendStatus === 'checking' && 'Connecting...'}
            {backendStatus === 'error' && 'Backend Offline'}
          </span>
          {backendStatus === 'error' && onRetryConnect && (
            <button
              onClick={onRetryConnect}
              className="ml-1 p-0.5 hover:bg-red-100 rounded text-red-800"
              title="Retry connection"
            >
              <RefreshCw className="w-3 h-3 animate-spin" />
            </button>
          )}
        </div>

        {/* Active Zone Switcher */}
        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-700 mr-1.5 flex-shrink-0" />
          <span className="text-slate-500 mr-1.5 hidden lg:inline font-medium">Zone:</span>
          <select
            id="header-zone-selector"
            value={selectedZone?.id}
            onChange={(e) => {
              const z = zones.find((item) => item.id === e.target.value);
              if (z) onSelectZone(z);
            }}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs pr-1"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id} className="bg-white text-slate-800">
                {z.code || z.id} — {z.name} ({z.temperature}°C)
              </option>
            ))}
          </select>
        </div>

        {/* Cooling Plan Quick Status */}
        <button
          id="header-plan-quick-btn"
          onClick={() => onNavigate('interventions')}
          className="flex items-center space-x-2 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs transition-all shadow-xs text-emerald-900 font-medium"
        >
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span className="text-emerald-700 font-semibold">Cooling Plan:</span>
          </div>
          <span className="font-extrabold text-emerald-900 font-mono-data">
            ₹{totalCostLakhs.toFixed(1)}L
          </span>
          <span className="bg-emerald-200/60 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-300">
            {selectedInterventionsCount} active
          </span>
        </button>
      </div>
    </header>
  );
};
