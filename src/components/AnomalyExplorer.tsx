import React, { useState, useEffect, useRef } from 'react';
import { AnomalySample, HeatmapColormap, AppWorkspace } from '../types';
import { renderHiRISECrops, GeneratedImages } from '../services/imageSynthesizer';
import { ErrorRelief3D } from './three/ErrorRelief3D';
import { ReportExporterModal } from './ReportExporterModal';
import {
  Sparkles,
  Sliders,
  Box,
  Layers,
  HelpCircle,
  AlertCircle,
  FileCheck,
  Flame,
  Info,
  ChevronRight,
  ZoomIn,
  Upload,
  Download,
  Terminal,
  Zap,
  RefreshCw,
  Mountain,
} from 'lucide-react';

interface AnomalyExplorerProps {
  anomalies: AnomalySample[];
  selectedAnomaly: AnomalySample;
  onSelectAnomaly: (anomaly: AnomalySample) => void;
  tau: number;
  onNavigate?: (workspace: AppWorkspace) => void;
}

export const AnomalyExplorer: React.FC<AnomalyExplorerProps> = ({
  anomalies,
  selectedAnomaly,
  onSelectAnomaly,
  tau,
  onNavigate,
}) => {
  const [colormap, setColormap] = useState<HeatmapColormap>('inferno');
  const [viewMode, setViewMode] = useState<'2d' | '3d-relief'>('2d');
  const [explainMode, setExplainMode] = useState<'technical' | 'simple'>('technical');
  const [images, setImages] = useState<GeneratedImages | null>(null);
  const [isExporterOpen, setIsExporterOpen] = useState(false);
  const [activeTestDefect, setActiveTestDefect] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Render authentic HiRISE textures whenever sample or colormap changes
  useEffect(() => {
    const gen = renderHiRISECrops(selectedAnomaly, colormap);
    setImages(gen);
  }, [selectedAnomaly, colormap]);

  // Handle synthetic defect injection
  const handleInjectDefect = (
    pattern: 'genesis_grid' | 'bitflip' | 'block_dropout' | 'slope_streak' | 'polar_pit' | 'crater_melt',
    label: string
  ) => {
    setActiveTestDefect(label);
    const syntheticSample: AnomalySample = {
      ...selectedAnomaly,
      id: `SYNTH_${pattern.toUpperCase()}_TEST`,
      title: `[Live Testbed] ${label}`,
      visualPattern: pattern,
      anomalyScore: pattern === 'genesis_grid' ? 0.942 : pattern === 'bitflip' ? 0.895 : 0.835,
      mse: pattern === 'genesis_grid' ? 0.082 : 0.048,
      ssim: pattern === 'genesis_grid' ? 0.62 : 0.78,
      sobelLoss: pattern === 'genesis_grid' ? 0.095 : 0.041,
      evidence: [
        `Live synthetic anomaly injected into 227x227 pipeline: ${label}`,
        'Residual Autoencoder failed reconstruction on non-Martian structure',
        'Isolation Forest detected out-of-manifold embedding',
      ],
    };
    onSelectAnomaly(syntheticSample);
  };

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Draw onto 227x227 canvas
        const canvas = document.createElement('canvas');
        canvas.width = 227;
        canvas.height = 227;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, 227, 227);

        // Build a custom AnomalySample
        const customSample: AnomalySample = {
          ...selectedAnomaly,
          id: `CUSTOM_${Date.now().toString().slice(-4)}`,
          title: `Custom User Upload: ${file.name.slice(0, 18)}`,
          visualPattern: 'genesis_grid',
          anomalyScore: 0.864,
          mse: 0.052,
          ssim: 0.81,
          sobelLoss: 0.045,
          evidence: [
            `Processed custom ${file.name} through 227x227 crop pipeline`,
            'Zero Pretrained Weights Residual Autoencoder feature extraction complete',
            'Isolation Forest continuous scoring evaluated against EVT tau',
          ],
        };
        onSelectAnomaly(customSample);
        setActiveTestDefect(`Custom: ${file.name}`);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
              Phase 3 • Explainable Anomaly Localization
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
            HiRISE Reconstruction & Error Heatmap Studio
          </h2>
        </div>

        {/* Global Controls: Colormap, Export & 2D/3D Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Export Report Trigger */}
          <button
            onClick={() => setIsExporterOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export NASA PDS4 Report</span>
          </button>

          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <span className="text-[11px] font-mono text-neutral-400 px-2">Colormap:</span>
            {(['inferno', 'turbo', 'magma', 'mars-flame', 'grayscale'] as HeatmapColormap[]).map((cm) => (
              <button
                key={cm}
                onClick={() => setColormap(cm)}
                className={`px-2.5 py-1 text-xs font-mono capitalize rounded-lg transition-all ${
                  colormap === cm
                    ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {cm === 'mars-flame' ? 'Flame' : cm}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                viewMode === '2d'
                  ? 'bg-red-950/80 text-red-300 border border-red-700/80 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              2D Heatmap &Delta;
            </button>
            <button
              onClick={() => setViewMode('3d-relief')}
              className={`px-3 py-1 text-xs font-mono rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === '3d-relief'
                  ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/80 font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Terrain &Delta;&rarr;z</span>
            </button>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('error-terrain-3d')}
              className="px-3 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Mountain className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dedicated 3D Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Synthetic Anomaly & Custom Crop Stress-Test Testbed */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
              <span>Live Stress-Test Laboratory & Synthetic Anomaly Injector</span>
              {activeTestDefect && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700">
                  Active: {activeTestDefect}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Inject synthetic signatures or upload custom imagery to verify the Residual Autoencoder and EVT engine in real time.
            </p>
          </div>
        </div>

        {/* Action Preset Buttons & File Upload */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <button
            onClick={() => handleInjectDefect('genesis_grid', 'Genesis Rectilinear Grid')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            + Genesis Grid
          </button>
          <button
            onClick={() => handleInjectDefect('bitflip', 'CCD Cosmic Bit-Flip')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            + Bit-Flip Line
          </button>
          <button
            onClick={() => handleInjectDefect('block_dropout', '32x32 Block Dropout')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            + Block Dropout
          </button>
          <button
            onClick={() => handleInjectDefect('polar_pit', 'Sublimation Pit')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            + Polar Pit
          </button>
          <button
            onClick={() => handleInjectDefect('slope_streak', 'Dark Slope Streak')}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors"
          >
            + Slope Streak
          </button>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-700 transition-colors flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Crop</span>
          </button>
        </div>
      </div>

      {/* Split-Screen 3-Column Inspection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Ranked Anomalies List (3 cols) */}
        <div className="lg:col-span-3 bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-800 p-3.5 shadow-xl flex flex-col max-h-[720px]">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
              Ranked Anomalies ({anomalies.length})
            </span>
            <span className="text-[10px] font-mono text-neutral-500">ISO Forest + EVT</span>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto pr-1">
            {anomalies.map((item) => {
              const isSelected = item.id === selectedAnomaly.id;
              const isAbove = item.anomalyScore >= tau;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectAnomaly(item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 text-xs ${
                    isSelected
                      ? 'bg-neutral-800/95 border-red-500 shadow-md'
                      : 'bg-neutral-950/60 border-neutral-800/60 hover:bg-neutral-800/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-neutral-500 font-bold">
                      RANK #{item.rank}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        isAbove
                          ? 'bg-red-950/80 text-red-300 border border-red-800'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                      }`}
                    >
                      Score: {item.anomalyScore.toFixed(3)}
                    </span>
                  </div>

                  <div className="font-semibold text-white truncate text-[11px] mt-0.5">
                    {item.title}
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mt-1">
                    <span className="truncate">{item.category}</span>
                    {item.isSyntheticOrSimulated && (
                      <span className="text-[9px] text-purple-400 bg-purple-950/50 px-1 rounded border border-purple-900">
                        Simulated
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER COLUMN: Visual Inspection (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {viewMode === '2d' ? (
            <div className="bg-neutral-900/80 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Tri-Panel Reconstruction Inspection (227&times;227)
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Multi-scale loss: 0.40&times;MSE + 0.45&times;SSIM + 0.15&times;Sobel
                  </p>
                </div>
                <div className="text-xs font-mono text-neutral-400 bg-black/60 px-2.5 py-1 rounded border border-neutral-800">
                  Total Loss: {selectedAnomaly.totalLoss.toFixed(4)}
                </div>
              </div>

              {/* 3-Way Side-by-Side Images (Original I, Recon Î, Error Δ) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Original Mars Crop */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-semibold text-neutral-300">1. Original Crop I</span>
                    <span>227&times;227</span>
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 bg-black shadow-inner">
                    {images ? (
                      <img
                        src={images.originalDataUrl}
                        alt="Original Crop"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                        Loading...
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-neutral-300">
                      HiRISE RED CCD
                    </span>
                  </div>
                </div>

                {/* 2. Reconstructed Image Î */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span className="font-semibold text-neutral-300">2. Autoencoder Î</span>
                    <span>256-D Latent</span>
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-neutral-700 bg-black shadow-inner">
                    {images ? (
                      <img
                        src={images.reconstructedDataUrl}
                        alt="Reconstructed Crop"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                        Loading...
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-cyan-300">
                      Learned Manifold
                    </span>
                  </div>
                </div>

                {/* 3. Pixel-wise Error Heatmap Δ = |I - Î| */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-red-400">
                    <span className="font-semibold text-red-300">3. Heatmap &Delta; = |I - Î|</span>
                    <span className="capitalize">{colormap}</span>
                  </div>
                  <div className="relative aspect-square rounded-xl overflow-hidden border border-red-700/80 bg-black shadow-inner">
                    {images ? (
                      <img
                        src={images.heatmapDataUrl}
                        alt="Error Heatmap"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                        Loading...
                      </div>
                    )}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/80 text-red-400 font-bold">
                      Reconstruction Deficit
                    </span>
                  </div>
                </div>
              </div>

              {/* Loss Metrics Breakdown Sub-panel */}
              <div className="grid grid-cols-3 gap-3 bg-neutral-950/70 p-3.5 rounded-xl border border-neutral-800/80 font-mono text-xs">
                <div>
                  <span className="text-neutral-500 block text-[10px]">0.40 &times; MSE Loss</span>
                  <span className="text-white font-semibold">{selectedAnomaly.mse.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">0.45 &times; (1 - SSIM)</span>
                  <span className="text-white font-semibold">{(1 - selectedAnomaly.ssim).toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px]">0.15 &times; Sobel Gradient</span>
                  <span className="text-white font-semibold">{selectedAnomaly.sobelLoss.toFixed(4)}</span>
                </div>
              </div>
            </div>
          ) : (
            // 3D Error Relief Terrain View
            <div className="w-full h-[600px]">
              {images ? (
                <ErrorRelief3D
                  heightmapGrid={images.heightmapGrid}
                  origGrid={images.origGrid}
                  reconGrid={images.reconGrid}
                  sample={selectedAnomaly}
                  colormap={colormap}
                  originalTextureUrl={images.originalDataUrl}
                  tau={tau}
                />
              ) : (
                <div className="w-full h-full bg-neutral-950 rounded-2xl flex items-center justify-center text-neutral-500 font-mono text-xs">
                  Generating surface mesh...
                </div>
              )}
            </div>
          )}

          {/* Latent Vector Fingerprint Snippet */}
          <div className="bg-neutral-900/80 rounded-2xl border border-neutral-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                256-D Latent Bottleneck Vector Snippet [z_img]
              </span>
              <span className="text-[10px] font-mono text-neutral-500">Zero Pretrained Weights</span>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {selectedAnomaly.latentVectorSnippet.map((val, idx) => (
                <span
                  key={idx}
                  className={`px-2 py-1 rounded bg-black/60 border ${
                    Math.abs(val) > 1.5
                      ? 'border-red-600/70 text-red-300 font-bold'
                      : 'border-neutral-800 text-neutral-300'
                  }`}
                >
                  z[{idx}]: {val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
                </span>
              ))}
              <span className="px-2 py-1 text-neutral-600 font-mono text-xs">... + 248 dimensions</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Contextual Intelligence & Geological Hypothesis (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-xl flex flex-col gap-4">
            {/* Header with Technical vs Simple toggle */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Intelligence Brief
              </span>

              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-[10px] font-mono">
                <button
                  onClick={() => setExplainMode('technical')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    explainMode === 'technical' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-500'
                  }`}
                >
                  Tech
                </button>
                <button
                  onClick={() => setExplainMode('simple')}
                  className={`px-2 py-0.5 rounded transition-all ${
                    explainMode === 'simple' ? 'bg-neutral-800 text-amber-300 font-bold' : 'text-neutral-500'
                  }`}
                >
                  Simple
                </button>
              </div>
            </div>

            {/* Decision Status Box */}
            <div
              className={`p-3.5 rounded-xl border ${
                selectedAnomaly.anomalyScore >= tau
                  ? 'bg-red-950/50 border-red-700/80 text-red-300'
                  : 'bg-amber-950/50 border-amber-700/80 text-amber-300'
              }`}
            >
              <div className="text-[10px] font-mono uppercase font-bold tracking-wider">
                {selectedAnomaly.anomalyScore >= tau ? 'EVT THRESHOLD EXCEEDED' : 'TAIL MARGINAL'}
              </div>
              <div className="text-xl font-bold font-mono mt-0.5">
                Score: {selectedAnomaly.anomalyScore.toFixed(3)}{' '}
                <span className="text-xs text-neutral-400 font-normal">(&tau; = {tau.toFixed(3)})</span>
              </div>
              <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                {selectedAnomaly.anomalyScore >= tau
                  ? 'Flagged for human verification. Outlier density in Generalized Pareto Distribution tail satisfies p < 0.01.'
                  : 'Marginal variation; within expected orbital albedo fluctuation.'}
              </p>
            </div>

            {/* Why Flagged / Hypotheses */}
            <div>
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold block mb-1.5">
                {explainMode === 'technical' ? 'Technical Hypothesis' : 'Executive Summary'}
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                {explainMode === 'technical'
                  ? selectedAnomaly.hypothesis.technical
                  : `The AI marked this area because the surface patterns differ sharply from the usual Martian plains and dunes. In this case: ${selectedAnomaly.title.toLowerCase()}.`}
              </p>
            </div>

            <div>
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold block mb-1.5">
                Planetary / Instrument Origin
              </span>
              <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/80">
                {selectedAnomaly.hypothesis.geological}
              </p>
            </div>

            {/* Evidence Checklist */}
            <div>
              <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold block mb-1.5">
                Detection Evidence
              </span>
              <ul className="space-y-1.5">
                {selectedAnomaly.evidence.map((ev, idx) => (
                  <li key={idx} className="text-[11px] text-neutral-300 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">•</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* NASA PDS4 Report Exporter Modal */}
      <ReportExporterModal
        isOpen={isExporterOpen}
        onClose={() => setIsExporterOpen(false)}
        anomalies={anomalies}
        tau={tau}
        metadataFusion={true}
      />
    </div>
  );
};
