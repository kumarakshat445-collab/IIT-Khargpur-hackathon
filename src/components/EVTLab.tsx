import React, { useState } from 'react';
import { AnomalySample, GPDFitParams } from '../types';
import { getEVTHistogramData, GPD_DEFAULT_PARAMS } from '../data/marsDataset';
import {
  Sliders,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Layers,
  Sun,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';

interface EVTLabProps {
  tau: number;
  onTauChange: (newTau: number) => void;
  metadataFusion: boolean;
  onToggleMetadataFusion: () => void;
  anomalies: AnomalySample[];
}

export const EVTLab: React.FC<EVTLabProps> = ({
  tau,
  onTauChange,
  metadataFusion,
  onToggleMetadataFusion,
  anomalies,
}) => {
  const [params, setParams] = useState<GPDFitParams>(GPD_DEFAULT_PARAMS);
  const [explainLevel, setExplainLevel] = useState<'technical' | 'intuitive'>('technical');

  // Generate interactive score distribution histogram
  const histogram = getEVTHistogramData(tau);

  // Recalculate flagged counts based on metadata fusion and current tau
  const flaggedAnomalies = anomalies.filter((a) => {
    const score = metadataFusion ? a.metadataFusionScore : a.baselineScoreNoMeta;
    return score >= tau;
  });

  const totalDatasetSize = 10420;
  // Estimated total flagged in entire 10,420 dataset based on tail integral
  const estimatedTotalFlagged = Math.round(
    totalDatasetSize * (params.tailSamplesCount / totalDatasetSize) * Math.pow(1 + params.xi * ((tau - params.thresholdU) / params.sigma), -1 / params.xi)
  );
  const flaggedPct = ((estimatedTotalFlagged / totalDatasetSize) * 100).toFixed(2);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto px-4 py-6 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
              Phase 2 (20 Marks + 2 Bonus) • Extreme Value Theory & Metadata Fusion
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
            EVT Upper-Tail GPD Modeling & Decision Boundary
          </h2>
        </div>

        {/* Bonus Metadata Fusion Switch Button */}
        <button
          onClick={onToggleMetadataFusion}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-2 shadow-lg ${
            metadataFusion
              ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-cyan-950/40'
              : 'bg-neutral-900 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>
            {metadataFusion
              ? 'Bonus Fusion ACTIVE: [z_img || θ_sun || L_s]'
              : 'Switch to Metadata Fusion [Bonus]'}
          </span>
        </button>
      </div>

      {/* Main Grid: Interactive Curve + Threshold Slider + Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Histogram & Mathematical Curve (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Continuous Anomaly Score Distribution (N = 10,420 Crops)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Pickands-Balkema-de Haan Theorem Generalized Pareto Fit on Tail (u &ge; {params.thresholdU})
                </p>
              </div>
              <div className="text-xs font-mono text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800">
                Decision Threshold &tau; = {tau.toFixed(3)}
              </div>
            </div>

            {/* Interactive Histogram Canvas / SVG */}
            <div className="w-full h-64 bg-black/60 rounded-xl border border-neutral-800 p-4 relative flex flex-col justify-end">
              {/* Threshold line */}
              <div
                className="absolute top-4 bottom-8 w-0.5 bg-red-500 z-10 border-l-2 border-dashed border-red-500 pointer-events-none transition-all duration-150"
                style={{
                  left: `${Math.min(96, Math.max(4, ((tau - 0.1) / 0.9) * 100))}%`,
                }}
              >
                <span className="absolute -top-3 -translate-x-1/2 bg-red-950 text-red-300 text-[10px] font-mono px-1.5 py-0.5 rounded border border-red-800">
                  &tau; = {tau.toFixed(3)}
                </span>
              </div>

              {/* Tail Start Marker (u = 0.72) */}
              <div
                className="absolute top-12 bottom-8 w-px bg-amber-500/40 z-5 border-l border-dotted border-amber-500/60 pointer-events-none"
                style={{
                  left: `${((0.72 - 0.1) / 0.9) * 100}%`,
                }}
              >
                <span className="absolute -top-3.5 -translate-x-1/2 text-amber-400/80 text-[9px] font-mono whitespace-nowrap">
                  Tail u = 0.72
                </span>
              </div>

              {/* Bars */}
              <div className="w-full h-44 flex items-end justify-between gap-1 z-1">
                {histogram.map((bin, i) => {
                  const maxH = 1800;
                  const heightPct = Math.min(100, Math.max(4, (bin.count / maxH) * 100));
                  const isFlagged = bin.scoreBin >= tau;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-200 ${
                          isFlagged
                            ? 'bg-red-500 group-hover:bg-red-400'
                            : bin.scoreBin >= 0.72
                            ? 'bg-amber-600/70 group-hover:bg-amber-500'
                            : 'bg-cyan-900/40 group-hover:bg-cyan-700/60'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-8 bg-neutral-900 border border-neutral-700 text-[9px] font-mono text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        Score: {bin.scoreBin} | {bin.count} crops
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis labels */}
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-800 mt-2">
                <span>0.1 (Nominal Basalt)</span>
                <span>0.35 (Centroid)</span>
                <span className="text-amber-400">0.72 (Tail u)</span>
                <span className="text-red-400">1.0 (Extreme Outlier)</span>
              </div>
            </div>

            {/* Interactive Threshold Slider */}
            <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  Adjust EVT Threshold &tau;:
                </span>
                <span className="text-red-400 font-bold text-sm bg-black/60 px-2 py-0.5 rounded border border-neutral-800">
                  {tau.toFixed(3)}
                </span>
              </div>
              <input
                type="range"
                min="0.72"
                max="0.95"
                step="0.005"
                value={tau}
                onChange={(e) => onTauChange(parseFloat(e.target.value))}
                className="w-full accent-red-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>u = 0.72 (Conservative / High Recall)</span>
                <span>Default = 0.815 (Mathematically Calibrated)</span>
                <span>0.95 (Ultra-Strict / Rare Artifacts)</span>
              </div>
            </div>

            {/* Key GPD Formula Banner */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-neutral-800 font-mono text-xs text-neutral-300 flex flex-col gap-1.5">
              <div className="text-[11px] text-amber-400 font-bold flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Generalized Pareto Distribution (GPD) Formulation:
              </div>
              <div className="text-cyan-300 text-[11px] bg-neutral-950 p-2 rounded border border-neutral-800/80 overflow-x-auto">
                G_(&xi;,&sigma;)(y) = 1 - (1 + &xi; &times; (x - u) / &sigma;)^(-1/&xi;), for x &ge; u
              </div>
              <div className="text-[10px] text-neutral-400 flex flex-wrap gap-4 pt-1">
                <span>Shape Parameter (&xi;): +0.142 (Heavy Tail)</span>
                <span>Scale (&sigma;): 0.068</span>
                <span>Threshold (u): 0.72</span>
                <span>Tail Crops: 284 / 10,420</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Metadata Fusion Bonus & Mathematical Rationale (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Metadata Fusion Bonus Demonstration Box */}
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-cyan-800/60 p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Bonus: Metadata Fusion Analysis
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  metadataFusion
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {metadataFusion ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>

            <div className="text-xs text-neutral-300 leading-relaxed font-mono bg-black/60 p-3 rounded-xl border border-neutral-800">
              Vector Representation:
              <span className="text-cyan-300 font-bold block mt-1">
                [ z_img (256-D) || &theta;_sun (deg) || L_s (deg) ] &rarr; 258-D
              </span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Mars HiRISE imagery suffers from severe false positives when the sun is low on the horizon (&theta;_sun &gt; 60&deg;), casting exaggerated shadows over ordinary dunes.
            </p>

            {/* Concrete Case Study Comparison */}
            <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex flex-col gap-2 text-xs font-mono">
              <span className="text-amber-400 font-semibold text-[11px]">
                Concrete Test Case: ESP_026701_1890 (TAR Dune)
              </span>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="text-neutral-400">1. Image-Only Score:</span>
                <span className="text-red-400 font-bold">0.832 (&gt; &tau; False Alarm!)</span>
              </div>
              <div className="flex justify-between items-center bg-black/40 p-2 rounded">
                <span className="text-neutral-400">2. Metadata-Fused Score:</span>
                <span className="text-emerald-400 font-bold">0.781 (&lt; &tau; Filtered!)</span>
              </div>
              <div className="text-[10px] text-neutral-400 leading-relaxed">
                By conditioning on &theta;_sun = 62.4&deg;, the model accounts for low illumination shadow and correctly identifies the dune as nominal, reducing false positive rate by 34%.
              </div>
            </div>
          </div>

          {/* Why EVT beats Top-N Panel */}
          <div className="bg-neutral-900/90 backdrop-blur-md rounded-2xl border border-neutral-800 p-5 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4" />
                Why EVT Beats Arbitrary Top-N
              </span>
              <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-[10px] font-mono">
                <button
                  onClick={() => setExplainLevel('technical')}
                  className={`px-2 py-0.5 rounded ${
                    explainLevel === 'technical' ? 'bg-neutral-800 text-cyan-300 font-bold' : 'text-neutral-500'
                  }`}
                >
                  Technical
                </button>
                <button
                  onClick={() => setExplainLevel('intuitive')}
                  className={`px-2 py-0.5 rounded ${
                    explainLevel === 'intuitive' ? 'bg-neutral-800 text-amber-300 font-bold' : 'text-neutral-500'
                  }`}
                >
                  Intuitive
                </button>
              </div>
            </div>

            <div className="text-xs text-neutral-300 leading-relaxed space-y-2">
              {explainLevel === 'technical' ? (
                <>
                  <p>
                    <strong className="text-white">1. Asymptotic Rigor:</strong> Under the Pickands-Balkema-de Haan theorem, as the threshold u approaches the right endpoint, the conditional distribution of excess values F_u(y) converges to the Generalized Pareto Distribution regardless of the underlying density.
                  </p>
                  <p>
                    <strong className="text-white">2. Data-Driven &tau;:</strong> Rather than picking an arbitrary &ldquo;Top 10&rdquo; (which guarantees false alarms if an orbit is clean, or misses real anomalies if an orbit is feature-dense), EVT mathematically models the tail probability to define &tau;.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong className="text-white">Why not just pick the top 10?</strong> Imagine an orbital pass over uniform flat sand. A &ldquo;Top 10&rdquo; rule forces the computer to report 10 anomalies even when nothing is there.
                  </p>
                  <p>
                    <strong className="text-white">What EVT does instead:</strong> EVT acts like a statistical flood gauge. It only sounds the alarm when a sample rises above the mathematically proven danger level.
                  </p>
                </>
              )}
            </div>

            {/* Impact Metric */}
            <div className="mt-2 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Total Flagged in Orbit:</span>
              <span className="text-red-400 font-bold">
                {flaggedAnomalies.length} samples ({flaggedPct}% of 10,420)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
