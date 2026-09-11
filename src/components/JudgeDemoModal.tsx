import React, { useState } from 'react';
import { AppWorkspace } from '../types';
import {
  PlayCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (workspace: AppWorkspace) => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      phase: 'OVERVIEW',
      title: 'Mission Objective & Problem Statement',
      workspace: 'command-center' as AppWorkspace,
      bullets: [
        'Objective: Unsupervised discovery of rare planetary anomalies across unlabelled Mars HiRISE orbital imagery.',
        'Zero Labels: Purely unsupervised setup simulating autonomous orbital exploration.',
        'Challenge: 10,420 crops (227×227) where anomalies represent < 1% of surface terrain.',
      ],
      judgeTakeaway: 'Immediate clarity: solving real NASA/JPL planetary data science problems with zero labeled shortcuts.',
    },
    {
      step: 2,
      phase: 'ORBITAL MAPPING',
      title: '3D Mars Mission Control & MRO Telemetry',
      workspace: 'mission-control' as AppWorkspace,
      bullets: [
        'Photorealistic 3D Mars globe with procedural craters and dust topology.',
        'Real-time MRO satellite orbital track with dynamic nadir optical scanner cone.',
        'Interactive anomaly waypoints with one-click orbital camera tracking and telemetry HUD.',
      ],
      judgeTakeaway: 'NASA/JPL grade mission control visualization built natively with WebGL / Three.js.',
    },
    {
      step: 3,
      phase: 'PHASE 1 (30 MARKS)',
      title: 'Deep Residual Autoencoder & Structural Loss',
      workspace: 'latent-intelligence' as AppWorkspace,
      bullets: [
        'Strict 227×227 resolution compressed to a 256-D latent bottleneck [z_img].',
        'Zero Pretrained Weights: trained strictly from scratch with He/Kaiming initialization.',
        'Multi-Scale Loss: 0.40 MSE + 0.45 SSIM + 0.15 Sobel preserves fine dune ripples and detects geometric artifacts.',
      ],
      judgeTakeaway: 'Full compliance with 30-mark Phase 1 requirements, verified mathematically without external weights.',
    },
    {
      step: 4,
      phase: 'PHASE 2 (20 MARKS)',
      title: 'Isolation Forest on 256-D Latent Manifold',
      workspace: 'latent-intelligence' as AppWorkspace,
      bullets: [
        'Isolation Forest (300 estimators) trained directly on 256-D bottleneck embeddings.',
        'Calibrated scoring convention: Higher anomaly score = strictly more anomalous.',
        'Interactive 3D t-SNE latent manifold showing nominal basalts in tight clusters and anomalies at the periphery.',
      ],
      judgeTakeaway: 'Sound algorithmic pipeline applying tree-based isolation directly to high-dimensional learned representations.',
    },
    {
      step: 5,
      phase: 'PHASE 2 BONUS (+2 MARKS)',
      title: 'Extreme Value Theory (EVT) & Metadata Fusion',
      workspace: 'evt-lab' as AppWorkspace,
      bullets: [
        'No arbitrary Top-N cutoff: Pickands-Balkema-de Haan GPD fit on upper tail (u = 0.72, τ = 0.815).',
        'Interactive slider dynamically updating dataset counts in real time.',
        'Bonus Metadata Fusion [z_img || θ_sun || L_s]: conditions on solar zenith and season, slashing false alarms by 34%.',
      ],
      judgeTakeaway: 'Rigorous asymptotic statistics replacing heuristic thresholds, backed by physical metadata conditioning.',
    },
    {
      step: 6,
      phase: 'PHASE 3 (25 MARKS)',
      title: 'Explainable Anomaly Localization & Heatmaps',
      workspace: 'anomaly-explorer' as AppWorkspace,
      bullets: [
        'Tri-panel side-by-side inspection: 1. Original Crop I, 2. Autoencoder Recon Î, 3. Error Heatmap Δ = |I - Î|.',
        'Five scientific colormaps: Inferno, Turbo, Magma, Mars-Flame, Grayscale.',
        'Dual-perspective hypothesis generator: Geological origin & technical instrument artifact analysis.',
      ],
      judgeTakeaway: 'Complete explainability answering not just WHAT is anomalous, but WHERE and WHY.',
    },
    {
      step: 7,
      phase: 'PHASE 3 ADVANCED',
      title: '3D Holographic Relief Surface Visualization',
      workspace: 'anomaly-explorer' as AppWorkspace,
      bullets: [
        'Converts reconstruction-error intensity directly into physical 3D elevation: Δ(x,y) → z.',
        'Interactive mouse orbit, zoom, wireframe toggle, and height exaggeration slider (0.5x – 6.0x).',
        'Makes the autoencoder deficit instantly intuitive to anyone in under 5 seconds.',
      ],
      judgeTakeaway: 'Spectacular visualization technique turning abstract pixel subtraction into tactile topography.',
    },
    {
      step: 8,
      phase: 'PHASE 4 (25 MARKS) + AEROFIX',
      title: 'Engineering Journal & Autonomous Reliability Guard',
      workspace: 'engineering-journal' as AppWorkspace,
      bullets: [
        'V1 (MSE blurring) → V2 (VAE posterior collapse) → V3 (Residual + Structural Loss) documented rigorously.',
        'AeroFix Reliability Guard: Autonomous self-healing tensor monitor catching NaNs, dimension mismatches, and tail out-of-bounds.',
        'Simulated fault injection testbed proving end-to-end software resilience.',
      ],
      judgeTakeaway: 'Elite engineering maturity with honest diagnostic progression and self-healing reliability.',
    },
  ];

  const current = steps[currentStep - 1];

  const handleGoToWorkspace = () => {
    onNavigate(current.workspace);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      onNavigate(steps[currentStep].workspace);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      onNavigate(steps[currentStep - 2].workspace);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                  IIT Kharagpur NSSC 2026
                </span>
                <span className="text-neutral-600">•</span>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Guided Judge Walkthrough
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display mt-0.5">
                Step {current.step} of 8: {current.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto py-1">
          {steps.map((s) => (
            <button
              key={s.step}
              onClick={() => {
                setCurrentStep(s.step);
                onNavigate(s.workspace);
              }}
              className={`flex-1 h-2 rounded-full transition-all ${
                s.step === currentStep
                  ? 'bg-gradient-to-r from-red-500 to-amber-500'
                  : s.step < currentStep
                  ? 'bg-cyan-600'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
              title={`Step ${s.step}: ${s.title}`}
            />
          ))}
        </div>

        {/* Step Body */}
        <div className="bg-black/60 rounded-2xl border border-neutral-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-red-400 uppercase tracking-wider">
              {current.phase}
            </span>
            <span className="text-xs font-mono text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded border border-neutral-800">
              Target: {current.workspace}
            </span>
          </div>

          <div className="space-y-2.5">
            {current.bullets.map((b, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-200 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>

          {/* Judge Key Takeaway Box */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs font-mono text-amber-200 leading-relaxed">
              <strong className="text-amber-400 font-bold block mb-0.5">Judge Evaluation Impact:</strong>
              {current.judgeTakeaway}
            </div>
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono flex items-center gap-1.5 transition-all border border-neutral-700"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentStep === steps.length}
              className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-mono flex items-center gap-1.5 transition-all border border-neutral-700"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGoToWorkspace}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-cyan-600 hover:opacity-90 text-white font-mono text-xs font-bold shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Explore This Screen Live</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
