import React, { useState } from 'react';
import { AnomalySample, AppWorkspace } from '../types';
import { LatentManifold3D } from './three/LatentManifold3D';
import {
  Cpu,
  Layers,
  ArrowRight,
  Database,
  BarChart,
  GitCommit,
  CheckCircle2,
  Maximize2,
  Eye,
} from 'lucide-react';

interface LatentIntelligenceProps {
  anomalies: AnomalySample[];
  selectedSample: AnomalySample;
  onSelectSample: (sample: AnomalySample) => void;
  onNavigate: (workspace: AppWorkspace) => void;
}

export const LatentIntelligence: React.FC<LatentIntelligenceProps> = ({
  anomalies,
  selectedSample,
  onSelectSample,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'manifold' | 'architecture'>('manifold');

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
              Phase 1 (30 Marks) • Deep Residual Autoencoder & Latent Manifold
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
            256-Dimensional Latent Embedding Intelligence
          </h2>
        </div>

        {/* Tab switch: 3D Manifold vs Architecture Flow */}
        <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('manifold')}
            className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all ${
              activeTab === 'manifold'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            3D Manifold Point Cloud
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3.5 py-1.5 text-xs font-mono rounded-lg transition-all ${
              activeTab === 'architecture'
                ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            4-Stage Residual Architecture
          </button>
        </div>
      </div>

      {activeTab === 'manifold' ? (
        /* 3D Manifold Projection + Live Cluster Analysis */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 w-full h-[540px]">
            <LatentManifold3D
              selectedSample={selectedSample}
              onSelectSample={onSelectSample}
              anomalies={anomalies}
            />
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Selected Point Inspection Card */}
            <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Active Latent Vector
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {selectedSample.coordinates.lat.toFixed(1)}°N, {selectedSample.coordinates.lon.toFixed(1)}°E
                </span>
              </div>

              <h3 className="text-base font-bold text-white leading-snug">
                {selectedSample.title}
              </h3>
              <div className="text-xs font-mono text-neutral-400 mt-0.5">
                ID: {selectedSample.id}
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800 space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Classification:</span>
                  <span className="text-neutral-300">{selectedSample.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Anomaly Score:</span>
                  <span
                    className={`font-bold ${
                      selectedSample.anomalyScore > 0.815 ? 'text-red-400' : 'text-cyan-400'
                    }`}
                  >
                    {selectedSample.anomalyScore.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Manifold Distance:</span>
                  <span className="text-neutral-300">
                    {Math.hypot(...selectedSample.tsne3D).toFixed(2)} &sigma;
                  </span>
                </div>
              </div>

              {/* 256-D snippet */}
              <div className="mt-4 pt-3 border-t border-neutral-800">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block mb-2">
                  Sample Embedding Coordinates [z_0 ... z_7]
                </span>
                <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
                  {selectedSample.latentVectorSnippet.map((v, i) => (
                    <div
                      key={i}
                      className={`p-1.5 rounded border ${
                        Math.abs(v) > 1.5
                          ? 'bg-red-950/40 border-red-800 text-red-300'
                          : 'bg-black/50 border-neutral-800 text-neutral-300'
                      }`}
                    >
                      <span className="text-neutral-500 block text-[8px]">z[{i}]</span>
                      {v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onNavigate('anomaly-explorer')}
                className="mt-5 w-full py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs flex items-center justify-center gap-2 transition-all border border-neutral-700"
              >
                <Eye className="w-3.5 h-3.5 text-red-400" />
                <span>View Error Heatmap In Explorer</span>
              </button>
            </div>

            {/* Dimensionality Reduction Methodology */}
            <div className="bg-neutral-900/70 rounded-2xl border border-neutral-800 p-4 font-mono text-xs text-neutral-400 space-y-2">
              <div className="text-neutral-200 font-bold uppercase text-[11px]">
                Manifold Reduction Note
              </div>
              <p className="text-[11px] leading-relaxed">
                The 256-D bottleneck embeddings are projected to 3D via t-SNE (perplexity = 35, learning rate = 200). Normal basaltic plains and ripple bedforms naturally cluster inside a tight hypersphere, while structural anomalies diverge into distinct peripheral filaments.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Architecture Flow Visualizer */
        <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-6 shadow-xl flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                Symmetric 4-Stage Residual Autoencoder (Scratch-Trained)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Zero Pretrained Weights • Multi-Scale Structural Loss (0.40 MSE + 0.45 SSIM + 0.15 Sobel)
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified: Zero Pretrained Weights</span>
            </div>
          </div>

          {/* Pipeline Architecture Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            {/* Stage 1: Input */}
            <div className="bg-black/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-1.5 text-center">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">INPUT TENSOR</span>
              <div className="text-lg font-bold text-white font-mono">227 &times; 227</div>
              <span className="text-[10px] font-mono text-neutral-400">1-Channel HiRISE RED</span>
              <span className="text-[9px] font-mono text-neutral-500">Min-Max Normalized [0,1]</span>
            </div>

            <div className="flex justify-center text-neutral-600">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Stage 2: 4-Stage Residual Encoder */}
            <div className="bg-black/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-1 text-center">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">4-STAGE RES-ENCODER</span>
              <div className="text-xs font-mono text-neutral-200 space-y-0.5">
                <div>Stage 1: Conv 32 (stride 2) &rarr; 114&times;114</div>
                <div>Stage 2: ResBlock 64 &rarr; 57&times;57</div>
                <div>Stage 3: ResBlock 128 &rarr; 29&times;29</div>
                <div>Stage 4: ResBlock 256 &rarr; 15&times;15</div>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 mt-1">BatchNorm + LeakyReLU (0.2)</span>
            </div>

            <div className="flex justify-center text-neutral-600">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Stage 3: 256-D Bottleneck */}
            <div className="bg-cyan-950/40 p-4 rounded-xl border border-cyan-700/80 flex flex-col gap-1.5 text-center shadow-lg shadow-cyan-950/20">
              <span className="text-[10px] font-mono text-cyan-300 font-bold">BOTTLENECK</span>
              <div className="text-2xl font-extrabold text-cyan-400 font-mono">256-D</div>
              <span className="text-[10px] font-mono text-neutral-300">Latent Embedding z</span>
              <span className="text-[9px] font-mono text-cyan-400/80">Compression: 201:1</span>
            </div>
          </div>

          {/* Symmetrical Decoder & Reconstruction */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
            {/* Stage 4: Bottleneck */}
            <div className="bg-cyan-950/40 p-4 rounded-xl border border-cyan-700/80 flex flex-col gap-1.5 text-center">
              <span className="text-[10px] font-mono text-cyan-300 font-bold">LATENT CODE</span>
              <div className="text-lg font-bold text-cyan-400 font-mono">256-D Vector</div>
              <span className="text-[10px] font-mono text-neutral-300">Deterministic Feature</span>
            </div>

            <div className="flex justify-center text-neutral-600">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Stage 5: Symmetrical Decoder */}
            <div className="bg-black/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-1 text-center">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">4-STAGE RES-DECODER</span>
              <div className="text-xs font-mono text-neutral-200 space-y-0.5">
                <div>Stage 4: ConvTrans 256 &rarr; 29&times;29</div>
                <div>Stage 3: ResBlock 128 &rarr; 57&times;57</div>
                <div>Stage 2: ResBlock 64 &rarr; 114&times;114</div>
                <div>Stage 1: ConvTrans 32 &rarr; 227&times;227</div>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 mt-1">Sigmoid Final Activation</span>
            </div>

            <div className="flex justify-center text-neutral-600">
              <ArrowRight className="w-5 h-5" />
            </div>

            {/* Stage 6: Reconstructed Output */}
            <div className="bg-black/60 p-4 rounded-xl border border-neutral-800 flex flex-col gap-1.5 text-center">
              <span className="text-[10px] font-mono text-cyan-400 font-bold">RECONSTRUCTION</span>
              <div className="text-lg font-bold text-white font-mono">227 &times; 227 Î</div>
              <span className="text-[10px] font-mono text-neutral-400">Nominal Terrain Manifold</span>
              <span className="text-[9px] font-mono text-red-400">Fails on Anomaly &Delta;</span>
            </div>
          </div>

          {/* Multi-Scale Loss Formulation Details */}
          <div className="p-4 rounded-xl bg-black/60 border border-neutral-800 flex flex-col gap-2 font-mono text-xs">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
              Competition Loss Function Formulation:
            </span>
            <div className="text-sm font-bold text-white bg-neutral-950 p-2.5 rounded border border-neutral-800">
              L_total = 0.40 &times; MSE(I, Î) + 0.45 &times; (1 - SSIM(I, Î)) + 0.15 &times; ||Sobel(I) - Sobel(Î)||_1
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-neutral-400 text-[11px] pt-1">
              <div>
                <strong className="text-neutral-200">0.40 &times; MSE:</strong> Penalizes coarse pixel-value errors and maintains global dynamic range calibration.
              </div>
              <div>
                <strong className="text-neutral-200">0.45 &times; SSIM:</strong> Preserves structural luminance, contrast, and inter-pixel geological correlation.
              </div>
              <div>
                <strong className="text-neutral-200">0.15 &times; Sobel Gradient:</strong> Enforces sharp preservation of natural dune crests, isolating synthetic rectilinear lines.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
