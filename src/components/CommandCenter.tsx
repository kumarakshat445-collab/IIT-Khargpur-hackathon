import React, { useState } from 'react';
import { AppWorkspace, AnomalySample } from '../types';
import {
  Sparkles,
  Search,
  Zap,
  Globe2,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Send,
  Layers,
  Database,
  BarChart3,
  Sliders,
  PlayCircle
} from 'lucide-react';

interface CommandCenterProps {
  onNavigate: (workspace: AppWorkspace) => void;
  anomalies: AnomalySample[];
  tau: number;
  onStartJudgeDemo: () => void;
  metadataFusion: boolean;
  onToggleMetadataFusion: () => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  onNavigate,
  anomalies,
  tau,
  onStartJudgeDemo,
  metadataFusion,
  onToggleMetadataFusion,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [lastExecutedMsg, setLastExecutedMsg] = useState<string | null>(null);

  const promptSuggestions = [
    { text: 'Analyze HiRISE observations & rank top anomalies', target: 'anomaly-explorer' as AppWorkspace },
    { text: 'Explain the current EVT threshold (τ = 0.815)', target: 'evt-lab' as AppWorkspace },
    { text: 'Investigate Genesis geometric grid artifact', target: 'anomaly-explorer' as AppWorkspace },
    { text: 'Inspect 3D Mars orbital coverage & MRO track', target: 'mission-control' as AppWorkspace },
    { text: 'Launch Hackathon Judge Demo (8-Step Walkthrough)', target: 'defense-panel' as AppWorkspace, isDemo: true },
  ];

  const handleExecuteCommand = (text: string, directTarget?: AppWorkspace, isDemo?: boolean) => {
    const q = text.toLowerCase();
    setLastExecutedMsg(`Executing command: "${text}"`);
    setTimeout(() => setLastExecutedMsg(null), 3000);

    if (isDemo || q.includes('judge') || q.includes('demo')) {
      onStartJudgeDemo();
      return;
    }

    if (directTarget) {
      onNavigate(directTarget);
      return;
    }

    if (q.includes('evt') || q.includes('threshold') || q.includes('pareto') || q.includes('tail')) {
      onNavigate('evt-lab');
    } else if (q.includes('globe') || q.includes('orbit') || q.includes('mission') || q.includes('mro')) {
      onNavigate('mission-control');
    } else if (q.includes('latent') || q.includes('manifold') || q.includes('256') || q.includes('embedding')) {
      onNavigate('latent-intelligence');
    } else if (q.includes('pipeline') || q.includes('phase')) {
      onNavigate('phase-pipeline');
    } else if (q.includes('journal') || q.includes('iteration') || q.includes('v1') || q.includes('v2') || q.includes('v3')) {
      onNavigate('engineering-journal');
    } else if (q.includes('compliance') || q.includes('defense') || q.includes('checklist')) {
      onNavigate('defense-panel');
    } else {
      onNavigate('anomaly-explorer');
    }
  };

  const flaggedCount = anomalies.filter((a) => a.anomalyScore >= tau).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-300 shadow-lg mb-6">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        <span className="font-semibold text-neutral-200">IIT Kharagpur NSSC 2026</span>
        <span className="text-neutral-500">•</span>
        <span className="text-cyan-400">Mars HiRISE Anomaly Detection Studio</span>
      </div>

      {/* Main Central Heading */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-center text-white font-display mb-4">
        What do you want to <span className="bg-gradient-to-r from-red-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">investigate</span>?
      </h1>
      <p className="text-base sm:text-lg text-neutral-400 text-center max-w-2xl mb-8 leading-relaxed">
        An AI mission-control workspace discovering unearthly surface structures, optical bit-flips, and rare geomorphology in Mars HiRISE orbital imagery.
      </p>

      {/* Primary Command Box */}
      <div className="w-full max-w-3xl bg-neutral-900/90 backdrop-blur-xl rounded-2xl border border-neutral-700/80 shadow-2xl p-4 transition-all focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 mb-6">
        <div className="flex items-start gap-3">
          <div className="mt-2.5 text-neutral-500">
            <Search className="w-5 h-5 text-neutral-400" />
          </div>
          <textarea
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (commandInput.trim()) {
                  handleExecuteCommand(commandInput);
                  setCommandInput('');
                }
              }
            }}
            placeholder="Analyze HiRISE observations, inspect anomalies, explain the EVT threshold, compare reconstructions, or investigate a suspicious Mars region…"
            rows={2}
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base outline-none resize-none pt-1.5 font-normal leading-relaxed"
          />
        </div>

        {/* Command Box Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/80 mt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMetadataFusion}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all flex items-center gap-1.5 ${
                metadataFusion
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                  : 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
              title="Toggle [z_img || θ_sun || L_s] metadata fusion"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Metadata Fusion: {metadataFusion ? 'ON [z_img || θ || Ls]' : 'OFF [Image-Only]'}</span>
            </button>

            <span className="text-xs font-mono text-neutral-400 hidden sm:inline-block px-2 py-1 rounded bg-neutral-950/80 border border-neutral-800">
              EVT &tau; = {tau.toFixed(3)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (commandInput.trim()) {
                  handleExecuteCommand(commandInput);
                  setCommandInput('');
                }
              }}
              disabled={!commandInput.trim()}
              className="p-2.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg"
              title="Submit command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Execution Feedback Notification */}
      {lastExecutedMsg && (
        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/80 px-4 py-1.5 rounded-full mb-4 animate-fade-in">
          {lastExecutedMsg}
        </div>
      )}

      {/* Quick Prompt Pill Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mb-10">
        <span className="text-xs font-mono text-neutral-500 mr-1">Suggestions:</span>
        {promptSuggestions.map((sug, i) => (
          <button
            key={i}
            onClick={() => handleExecuteCommand(sug.text, sug.target, sug.isDemo)}
            className="px-3 py-1.5 text-xs font-mono rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            {sug.isDemo && <PlayCircle className="w-3.5 h-3.5 text-amber-400" />}
            <span>{sug.text}</span>
          </button>
        ))}
      </div>

      {/* Three Premium Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-4xl">
        {/* ANALYZE CARD */}
        <div
          onClick={() => onNavigate('anomaly-explorer')}
          className="group relative bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-red-500/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-red-950/20 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-red-400 font-bold uppercase tracking-wider mb-1">
              Phase 3 • Localization
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
              ANALYZE
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Inspect pixel-wise error heatmaps (&Delta; = |I - Î|) identifying exactly where the residual autoencoder fails on anomalous terrain.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 group-hover:text-red-300 mt-6">
            <span>Explore {flaggedCount} Flagged Crops</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* BUILD CARD */}
        <div
          onClick={() => onNavigate('phase-pipeline')}
          className="group relative bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-cyan-950/20 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1">
              Phases 1-4 • Full Pipeline
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              BUILD PIPELINE
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Verify the complete 4-stage residual autoencoder (scratch-trained, zero pretrained weights, multi-scale loss) & Isolation Forest pipeline.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 group-hover:text-cyan-300 mt-6">
            <span>View 100 Marks Coverage</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* INTELLIGENCE CARD */}
        <div
          onClick={() => onNavigate('evt-lab')}
          className="group relative bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-6 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-amber-950/20 flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider mb-1">
              Phase 2 • EVT / GPD Tail
            </div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
              INTELLIGENCE
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Understand why the AI flags an observation using Generalized Pareto Distribution tail fitting rather than arbitrary Top-N cutoffs.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400 group-hover:text-amber-300 mt-6">
            <span>Inspect EVT &tau; Curve</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Mission Telemetry Quick Peek Footer */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-neutral-500 border-t border-neutral-800/60 pt-6 w-full max-w-4xl">
        <div className="flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-neutral-400" />
          <span>Orbiter: MRO / HiRISE Optical</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-neutral-400" />
          <span>Dataset: 10,420 Normalized Crops (227x227)</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Weights: Scratch-Trained (Zero Pretrained)</span>
        </div>
      </div>
    </div>
  );
};
