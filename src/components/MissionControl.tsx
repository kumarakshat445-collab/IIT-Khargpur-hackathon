import React, { useState } from 'react';
import { AnomalySample, AppWorkspace } from '../types';
import { MarsGlobe3D } from './three/MarsGlobe3D';
import {
  Globe,
  Radio,
  Navigation,
  Compass,
  Maximize2,
  ChevronRight,
  SunMedium,
  ShieldAlert,
  ArrowUpRight,
  Layers,
} from 'lucide-react';

interface MissionControlProps {
  anomalies: AnomalySample[];
  selectedAnomaly: AnomalySample;
  onSelectAnomaly: (anomaly: AnomalySample) => void;
  onNavigate: (workspace: AppWorkspace) => void;
  tau: number;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  anomalies,
  selectedAnomaly,
  onSelectAnomaly,
  onNavigate,
  tau,
}) => {
  const [flyTrigger, setFlyTrigger] = useState(0);

  const handleFlyTo = (anomaly: AnomalySample) => {
    onSelectAnomaly(anomaly);
    setFlyTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Orbital Telemetry & Geospatial Mapping
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
            HiRISE Mission Control Dashboard
          </h2>
        </div>

        {/* Live Orbiter State Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleFlyTo(selectedAnomaly)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-90 text-white font-mono text-xs font-semibold flex items-center gap-2 shadow-lg transition-all"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Fly To Active Anomaly</span>
          </button>
        </div>
      </div>

      {/* Main Grid: 3D Globe + Mission Telemetry & Waypoints */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Mars Globe Interactive View (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="w-full h-[540px] rounded-2xl overflow-hidden shadow-2xl">
            <MarsGlobe3D
              anomalies={anomalies}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={onSelectAnomaly}
              flyToTrigger={flyTrigger}
            />
          </div>

          {/* Telemetry Strip below globe */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-900/70 p-4 rounded-xl border border-neutral-800/80 font-mono text-xs">
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Orbiter Altitude</span>
              <span className="text-neutral-200 font-semibold text-sm">284.2 km</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Orbital Velocity</span>
              <span className="text-neutral-200 font-semibold text-sm">3.41 km/s</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">Solar Season (Ls)</span>
              <span className="text-amber-400 font-semibold text-sm">{selectedAnomaly.solarLongitude.toFixed(1)}°</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px] uppercase">EVT Cutoff (&tau;)</span>
              <span className="text-cyan-400 font-semibold text-sm">{tau.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Target HUD & Anomaly Waypoint Roster (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Active Target Card */}
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-red-500 animate-ping" />
                Active Target Observation
              </span>
              <span className="text-xs font-mono text-neutral-400">
                #{selectedAnomaly.rank} of {anomalies.length}
              </span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug">
              {selectedAnomaly.title}
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              ID: {selectedAnomaly.id}
            </p>

            <div className="mt-4 pt-3 border-t border-neutral-800/80 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">Location:</span>
                <span className="text-neutral-300 text-right">{selectedAnomaly.locationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Coordinates:</span>
                <span className="text-cyan-400 font-semibold">
                  {selectedAnomaly.coordinates.lat.toFixed(2)}°N, {selectedAnomaly.coordinates.lon.toFixed(2)}°E
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Anomaly Score:</span>
                <span className="text-red-400 font-bold text-sm">
                  {selectedAnomaly.anomalyScore.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">EVT Tail Status:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedAnomaly.evtStatus === 'ABOVE_TAU'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {selectedAnomaly.evtStatus === 'ABOVE_TAU' ? 'ABOVE THRESHOLD τ' : 'TAIL MARGINAL'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Solar Zenith (θ_sun):</span>
                <span className="text-neutral-300">{selectedAnomaly.solarZenithAngle.toFixed(1)}°</span>
              </div>
            </div>

            {/* Direct Link to Detailed Anomaly Inspection */}
            <button
              onClick={() => onNavigate('anomaly-explorer')}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs flex items-center justify-center gap-2 transition-all border border-neutral-700 group"
            >
              <span>Inspect Reconstructions & Heatmaps</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-cyan-400" />
            </button>
          </div>

          {/* Anomaly Waypoints List */}
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-4 shadow-xl flex flex-col flex-1 max-h-[340px]">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                Waypoint Targets ({anomalies.length})
              </span>
              <span className="text-[10px] font-mono text-neutral-500">Click to focus</span>
            </div>

            <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
              {anomalies.map((a) => {
                const isSelected = a.id === selectedAnomaly.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => handleFlyTo(a)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-neutral-800/90 border-red-500/80 shadow-md'
                        : 'bg-neutral-950/60 border-neutral-800/60 hover:bg-neutral-800/50 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          a.rank === 1
                            ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {a.rank}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate text-[11px]">
                          {a.title}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500">
                          {a.coordinates.lat.toFixed(1)}°N, {a.coordinates.lon.toFixed(1)}°E
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold ${
                          a.anomalyScore >= tau ? 'text-red-400' : 'text-amber-400'
                        }`}
                      >
                        {a.anomalyScore.toFixed(2)}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
