import React, { useState } from 'react';
import { AppWorkspace, AnomalySample, HeatmapColormap } from './types';
import { MARS_ANOMALIES, DEFAULT_TAU } from './data/marsDataset';

// Workspaces
import { CommandCenter } from './components/CommandCenter';
import { MissionControl } from './components/MissionControl';
import { AnomalyExplorer } from './components/AnomalyExplorer';
import { ErrorTerrainStudio } from './components/ErrorTerrainStudio';
import { EVTLab } from './components/EVTLab';
import { LatentIntelligence } from './components/LatentIntelligence';
import { PhasePipeline } from './components/PhasePipeline';
import { EngineeringJournal } from './components/EngineeringJournal';
import { DefensePanel } from './components/DefensePanel';
import { AeroFixGuard } from './components/AeroFixGuard';
import { JudgeDemoModal } from './components/JudgeDemoModal';

// Icons
import {
  Globe,
  Radio,
  Sparkles,
  Sliders,
  Cpu,
  Layers,
  BookOpen,
  ShieldCheck,
  PlayCircle,
  Terminal,
  Activity,
  Menu,
  X,
  Compass,
  ChevronDown,
  Mountain,
} from 'lucide-react';

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<AppWorkspace>('command-center');
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalySample>(MARS_ANOMALIES[0]);
  const [tau, setTau] = useState<number>(DEFAULT_TAU);
  const [colormap, setColormap] = useState<HeatmapColormap>('inferno');
  const [metadataFusion, setMetadataFusion] = useState<boolean>(true);
  const [isJudgeDemoOpen, setIsJudgeDemoOpen] = useState<boolean>(false);
  const [showAeroFixDrawer, setShowAeroFixDrawer] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navigationItems = [
    { id: 'command-center' as AppWorkspace, label: 'Command Center', icon: Radio, badge: 'Home' },
    { id: 'mission-control' as AppWorkspace, label: '3D Mars Mission Control', icon: Globe, badge: 'Orbit' },
    { id: 'anomaly-explorer' as AppWorkspace, label: 'Anomaly Explorer (Phase 3)', icon: Sparkles, badge: 'Heatmaps' },
    { id: 'error-terrain-3d' as AppWorkspace, label: '3D Error Terrain Studio', icon: Mountain, badge: '\u0394\u2192Height' },
    { id: 'evt-lab' as AppWorkspace, label: 'EVT & Metadata Lab (Phase 2)', icon: Sliders, badge: 'Tail GPD' },
    { id: 'latent-intelligence' as AppWorkspace, label: '256-D Latent Manifold (Phase 1)', icon: Cpu, badge: 't-SNE' },
    { id: 'phase-pipeline' as AppWorkspace, label: 'Phases 1-4 Pipeline', icon: Layers, badge: '100 pts' },
    { id: 'engineering-journal' as AppWorkspace, label: 'Engineering Journal (Phase 4)', icon: BookOpen, badge: 'V1-V3' },
    { id: 'defense-panel' as AppWorkspace, label: 'Compliance Defense Deck', icon: ShieldCheck, badge: 'Checklist' },
  ];

  const handleSelectWorkspace = (workspace: AppWorkspace) => {
    setActiveWorkspace(workspace);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-red-500 selection:text-white font-sans antialiased">
      {/* Top Universal App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-800/80 px-4 lg:px-6 h-16 flex items-center justify-between">
        {/* Brand & Mission Tag */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            onClick={() => handleSelectWorkspace('command-center')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 via-amber-600 to-cyan-500 p-0.5 shadow-lg shadow-red-950/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-neutral-950 rounded-[10px] flex items-center justify-center">
                <Compass className="w-5 h-5 text-red-500 group-hover:rotate-45 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold tracking-tight text-white text-base sm:text-lg">
                  AEROMARS
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/80">
                  HiRISE
                </span>
              </div>
              <div className="text-[10px] font-mono text-neutral-400 hidden sm:block">
                IIT KGP NSSC 2026 • AI Mission Control
              </div>
            </div>
          </div>
        </div>

        {/* Global Live Badges & Telemetry Bar */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MRO Orbiter: 284 km</span>
          </div>

          <button
            onClick={() => setMetadataFusion(!metadataFusion)}
            className={`px-3 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
              metadataFusion
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700 font-bold'
                : 'bg-neutral-900/80 text-neutral-400 border-neutral-800'
            }`}
          >
            <span>Metadata: {metadataFusion ? 'ON [z || θ || Ls]' : 'OFF'}</span>
          </button>

          <div className="px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-amber-400 font-bold">
            EVT &tau; = {tau.toFixed(3)}
          </div>
        </div>

        {/* Right Actions: AeroFix Trigger + Judge Demo Launcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* AeroFix Guard Toggle Button */}
          <button
            onClick={() => setShowAeroFixDrawer(!showAeroFixDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-sm ${
              showAeroFixDrawer
                ? 'bg-purple-950 text-purple-300 border-purple-600 shadow-purple-950/30'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-purple-700/60 hover:text-white'
            }`}
            title="AeroFix Autonomous Pipeline Reliability Guard"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AeroFix Guard</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>

          {/* Judge Demo Launcher */}
          <button
            onClick={() => setIsJudgeDemoOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-cyan-600 hover:opacity-95 text-white font-mono text-xs font-bold shadow-lg shadow-red-950/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4 text-white animate-pulse" />
            <span className="hidden sm:inline">Judge Demo Mode</span>
            <span className="sm:hidden">Demo</span>
          </button>
        </div>
      </header>

      {/* Main App Layout: Persistent Left Navigation (Desktop) + Workspace Content */}
      <div className="flex-1 flex w-full relative">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-neutral-800/80 bg-neutral-950/50 backdrop-blur-md p-4 space-y-1.5 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider px-3 mb-2 font-bold">
            Navigation Workspaces
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeWorkspace === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectWorkspace(item.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-left text-xs font-mono font-medium flex items-center justify-between transition-all group ${
                  isActive
                    ? 'bg-neutral-800/90 text-white font-bold border border-neutral-700 shadow-md'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-cyan-400' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      : 'bg-neutral-900 text-neutral-500'
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}

          {/* Active Anomaly Quick Status Widget in Sidebar */}
          <div className="mt-auto pt-4 border-t border-neutral-800/80">
            <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 text-[11px] font-mono space-y-1.5">
              <div className="text-neutral-500 text-[9px] uppercase font-bold flex items-center justify-between">
                <span>Selected Anomaly</span>
                <span className="text-red-400">Rank #{selectedAnomaly.rank}</span>
              </div>
              <div className="font-semibold text-white truncate text-xs">
                {selectedAnomaly.title}
              </div>
              <div className="text-neutral-400 flex justify-between text-[10px]">
                <span>Score:</span>
                <span className="text-red-400 font-bold">{selectedAnomaly.anomalyScore.toFixed(3)}</span>
              </div>
              <button
                onClick={() => handleSelectWorkspace('anomaly-explorer')}
                className="w-full mt-1.5 py-1 text-[10px] rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-center transition-colors"
              >
                Inspect Details &rarr;
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col p-6 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <span className="font-display font-bold text-white text-lg">AEROMARS Workspaces</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg bg-neutral-900 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeWorkspace === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectWorkspace(item.id)}
                    className={`p-3 rounded-xl text-left text-xs font-mono flex items-center justify-between ${
                      isActive
                        ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                        : 'text-neutral-400 hover:bg-neutral-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-neutral-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400">
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 pb-16">
          {/* Collapsible AeroFix Reliability Guard Top Bar */}
          {showAeroFixDrawer && (
            <div className="p-4 border-b border-purple-900/40 bg-purple-950/10 animate-fade-in">
              <div className="max-w-7xl mx-auto">
                <AeroFixGuard />
              </div>
            </div>
          )}

          {/* Active Workspace View Switcher */}
          {activeWorkspace === 'command-center' && (
            <CommandCenter
              onNavigate={handleSelectWorkspace}
              anomalies={MARS_ANOMALIES}
              tau={tau}
              onStartJudgeDemo={() => setIsJudgeDemoOpen(true)}
              metadataFusion={metadataFusion}
              onToggleMetadataFusion={() => setMetadataFusion(!metadataFusion)}
            />
          )}

          {activeWorkspace === 'mission-control' && (
            <MissionControl
              anomalies={MARS_ANOMALIES}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={setSelectedAnomaly}
              onNavigate={handleSelectWorkspace}
              tau={tau}
            />
          )}

          {activeWorkspace === 'anomaly-explorer' && (
            <AnomalyExplorer
              anomalies={MARS_ANOMALIES}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={setSelectedAnomaly}
              tau={tau}
              onNavigate={handleSelectWorkspace}
            />
          )}

          {activeWorkspace === 'error-terrain-3d' && (
            <ErrorTerrainStudio
              anomalies={MARS_ANOMALIES}
              selectedAnomaly={selectedAnomaly}
              onSelectAnomaly={setSelectedAnomaly}
              colormap={colormap}
              onChangeColormap={setColormap}
              tau={tau}
              onNavigate={handleSelectWorkspace}
            />
          )}

          {activeWorkspace === 'evt-lab' && (
            <EVTLab
              tau={tau}
              onTauChange={setTau}
              metadataFusion={metadataFusion}
              onToggleMetadataFusion={() => setMetadataFusion(!metadataFusion)}
              anomalies={MARS_ANOMALIES}
            />
          )}

          {activeWorkspace === 'latent-intelligence' && (
            <LatentIntelligence
              anomalies={MARS_ANOMALIES}
              selectedSample={selectedAnomaly}
              onSelectSample={setSelectedAnomaly}
              onNavigate={handleSelectWorkspace}
            />
          )}

          {activeWorkspace === 'phase-pipeline' && (
            <PhasePipeline onNavigate={handleSelectWorkspace} />
          )}

          {activeWorkspace === 'engineering-journal' && <EngineeringJournal />}

          {activeWorkspace === 'defense-panel' && (
            <DefensePanel
              onStartJudgeDemo={() => setIsJudgeDemoOpen(true)}
              onNavigate={handleSelectWorkspace}
            />
          )}
        </main>
      </div>

      {/* Global Interactive Judge Demo Modal */}
      <JudgeDemoModal
        isOpen={isJudgeDemoOpen}
        onClose={() => setIsJudgeDemoOpen(false)}
        onNavigate={handleSelectWorkspace}
      />
    </div>
  );
}
