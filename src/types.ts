export type AnomalyCategory =
  | 'Geological Fluvial/Volcanic'
  | 'Sensor Dropout / Bit-Flip'
  | 'Corrupted Pixel Block'
  | 'Synthetic Genesis Grid (Tampered)'
  | 'Slope Streaks / Frost Sublimation'
  | 'Dune Morphology Defect';

export type EVTStatus = 'ABOVE_TAU' | 'TAIL_MARGINAL' | 'NOMINAL';

export interface AnomalySample {
  id: string;
  rank: number;
  title: string;
  anomalyScore: number; // 0.0 - 1.0 (Higher = more anomalous)
  baselineScoreNoMeta: number;
  metadataFusionScore: number;
  evtStatus: EVTStatus;
  coordinates: {
    lat: number;
    lon: number;
  };
  locationName: string;
  solarZenithAngle: number; // θ_sun (degrees)
  solarLongitude: number; // L_s (degrees)
  category: AnomalyCategory;
  isSyntheticOrSimulated: boolean;
  mse: number;
  ssim: number;
  sobelLoss: number;
  totalLoss: number; // 0.40*MSE + 0.45*SSIM + 0.15*Sobel
  hypothesis: {
    technical: string;
    geological: string;
    falsePositiveRisk: string;
  };
  evidence: string[];
  latentVectorSnippet: number[]; // representative slice of 256-D embedding
  tsne3D: [number, number, number]; // 3D coordinates in latent manifold
  visualPattern: 'bitflip' | 'genesis_grid' | 'block_dropout' | 'crater_melt' | 'slope_streak' | 'polar_pit' | 'dune_chaos';
}

export type HeatmapColormap = 'inferno' | 'turbo' | 'magma' | 'mars-flame' | 'grayscale';

export type AppWorkspace =
  | 'command-center'
  | 'mission-control'
  | 'anomaly-explorer'
  | 'error-terrain-3d'
  | 'latent-intelligence'
  | 'evt-lab'
  | 'phase-pipeline'
  | 'engineering-journal'
  | 'defense-panel';

export interface GPDFitParams {
  thresholdU: number; // tail onset threshold u
  tau: number; // calculated EVT decision boundary τ
  xi: number; // shape parameter ξ (tail heaviness)
  sigma: number; // scale parameter σ
  pExceedance: number; // risk level (e.g. 0.01 = 1%)
  totalSamples: number;
  tailSamplesCount: number;
}

export interface AeroFixLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'FAULT_DETECTED' | 'RECOVERED';
  subsystem: 'LATENT_ENCODER' | 'EVT_ENGINE' | 'ISO_FOREST' | 'RENDER_PIPELINE' | 'METADATA_FUSION';
  message: string;
  actionTaken?: string;
}

export interface JudgeDemoStep {
  stepNumber: number;
  title: string;
  phaseTag: string;
  description: string;
  targetWorkspace: AppWorkspace;
  actionScript?: string;
  keyTakeaway: string;
}
