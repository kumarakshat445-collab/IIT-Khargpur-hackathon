import { AnomalySample, HeatmapColormap } from '../types';

export interface GeneratedImages {
  originalDataUrl: string;
  reconstructedDataUrl: string;
  heatmapDataUrl: string;
  heightmapGrid: number[][]; // 2D matrix of error intensities for 3D relief mesh
  origGrid: number[][]; // 2D matrix of original image normalized DN [0, 1]
  reconGrid: number[][]; // 2D matrix of reconstructed normalized DN [0, 1]
}

// Colormap color interpolation
export function getColormapRgb(normalizedVal: number, colormap: HeatmapColormap): [number, number, number] {
  const v = Math.min(1, Math.max(0, normalizedVal));

  if (colormap === 'grayscale') {
    const c = Math.round(v * 255);
    return [c, c, c];
  }

  if (colormap === 'mars-flame') {
    // Terracotta black -> deep red -> orange-gold -> white
    if (v < 0.25) {
      const t = v / 0.25;
      return [Math.round(20 + 80 * t), Math.round(10 * t), 5];
    } else if (v < 0.6) {
      const t = (v - 0.25) / 0.35;
      return [Math.round(100 + 130 * t), Math.round(10 + 60 * t), Math.round(5 + 10 * t)];
    } else if (v < 0.85) {
      const t = (v - 0.6) / 0.25;
      return [230 + Math.round(25 * t), Math.round(70 + 130 * t), Math.round(15 + 40 * t)];
    } else {
      const t = (v - 0.85) / 0.15;
      return [255, Math.round(200 + 55 * t), Math.round(55 + 200 * t)];
    }
  }

  if (colormap === 'turbo') {
    // Blue -> Cyan -> Green -> Yellow -> Red
    if (v < 0.25) {
      const t = v / 0.25;
      return [Math.round(40 * (1 - t)), Math.round(100 * t), Math.round(180 + 75 * t)];
    } else if (v < 0.5) {
      const t = (v - 0.25) / 0.25;
      return [Math.round(30 * t), Math.round(100 + 130 * t), Math.round(255 * (1 - t))];
    } else if (v < 0.75) {
      const t = (v - 0.5) / 0.25;
      return [Math.round(30 + 220 * t), Math.round(230 + 20 * t), 10];
    } else {
      const t = (v - 0.75) / 0.25;
      return [255, Math.round(250 * (1 - t)), Math.round(10 + 20 * (1 - t))];
    }
  }

  if (colormap === 'magma') {
    // Deep purple -> Magenta -> Orange -> Yellow
    const r = Math.round(255 * Math.min(1, Math.max(0, 1.5 * v - 0.1)));
    const g = Math.round(255 * Math.min(1, Math.max(0, 1.3 * v * v)));
    const b = Math.round(255 * Math.min(1, Math.max(0, 0.8 * Math.sin(v * Math.PI))));
    return [r, g, b];
  }

  // Default: Inferno (Black -> Purple -> Warm Red -> Golden Yellow -> White)
  if (v < 0.2) {
    const t = v / 0.2;
    return [Math.round(10 + 50 * t), 5, Math.round(20 + 70 * t)];
  } else if (v < 0.5) {
    const t = (v - 0.2) / 0.3;
    return [Math.round(60 + 130 * t), Math.round(5 + 30 * t), Math.round(90 * (1 - t))];
  } else if (v < 0.8) {
    const t = (v - 0.5) / 0.3;
    return [Math.round(190 + 55 * t), Math.round(35 + 150 * t), 10];
  } else {
    const t = (v - 0.8) / 0.2;
    return [Math.round(245 + 10 * t), Math.round(185 + 70 * t), Math.round(10 + 245 * t)];
  }
}

// Generate procedural Mars HiRISE textures directly onto HTML5 Canvases
export function renderHiRISECrops(
  sample: AnomalySample,
  colormap: HeatmapColormap = 'inferno'
): GeneratedImages {
  const size = 227; // Competition requirement: 227x227

  // Helper canvas creator
  const createOffscreen = () => {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    return { canvas: c, ctx: c.getContext('2d', { willReadFrequently: true })! };
  };

  const orig = createOffscreen();
  const recon = createOffscreen();
  const diff = createOffscreen();

  const origImgData = orig.ctx.createImageData(size, size);
  const reconImgData = recon.ctx.createImageData(size, size);
  const diffImgData = diff.ctx.createImageData(size, size);

  // High-definition heightmap grid (64x64 for smooth 3D Three.js mesh rendering)
  const meshDim = 64;
  const heightmapGrid: number[][] = Array.from({ length: meshDim }, () =>
    Array(meshDim).fill(0)
  );
  const origGrid: number[][] = Array.from({ length: meshDim }, () =>
    Array(meshDim).fill(0)
  );
  const reconGrid: number[][] = Array.from({ length: meshDim }, () =>
    Array(meshDim).fill(0)
  );

  // Seeded procedural noise generator
  let seed = sample.rank * 1337 + sample.id.length * 42;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Base Martian background: basaltic dunes & craters
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Aeolian ripple frequencies
      const wave1 = Math.sin(x * 0.08 + y * 0.04 + Math.cos(y * 0.02) * 2.0);
      const wave2 = Math.sin(x * 0.18 - y * 0.06);
      const fineNoise = (random() - 0.5) * 0.15;
      
      // Base grayscale intensity for Mars regolith (0.0 to 1.0)
      let baseVal = 0.42 + wave1 * 0.14 + wave2 * 0.06 + fineNoise;

      // Add crater rim depression if sample has crater context
      const cx = size * 0.5;
      const cy = size * 0.5;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < 80) {
        baseVal -= Math.sin((dist / 80) * Math.PI) * 0.12;
      }

      baseVal = Math.min(0.95, Math.max(0.08, baseVal));

      // Reconstructed image baseline (Residual autoencoder learned smooth manifold)
      let reconVal = 0.42 + wave1 * 0.13 + wave2 * 0.05; // smooth dune reconstruction
      if (dist < 80) {
        reconVal -= Math.sin((dist / 80) * Math.PI) * 0.11;
      }

      // Anomaly injection logic
      let anomalyDelta = 0;

      if (sample.visualPattern === 'genesis_grid') {
        // Orthogonal rectilinear grid lines (unearthly Genesis structure)
        const inBox = x > 40 && x < 187 && y > 40 && y < 187;
        if (inBox) {
          const gridX = (x - 40) % 24 === 0 || (x - 40) % 24 === 1;
          const gridY = (y - 40) % 24 === 0 || (y - 40) % 24 === 1;
          if (gridX || gridY) {
            baseVal = 0.95; // bright rectilinear lines
            // Autoencoder fails to predict orthogonal grid -> large reconstruction difference
            reconVal = 0.45; 
            anomalyDelta = 0.88;
          }
        }
      } else if (sample.visualPattern === 'bitflip') {
        // Vertical 1-pixel sensor line dropout
        if (Math.abs(x - 114) <= 1 && y > 20 && y < 210) {
          baseVal = 0.98; // saturated DN line
          reconVal = 0.42; // autoencoder predicts surrounding terrain
          anomalyDelta = 0.92;
        }
      } else if (sample.visualPattern === 'block_dropout') {
        // 32x32 pixel JPEG decompression phase failure
        if (x >= 80 && x <= 144 && y >= 70 && y <= 134) {
          baseVal = (baseVal * 0.4) + 0.55;
          anomalyDelta = 0.74;
        }
      } else if (sample.visualPattern === 'slope_streak') {
        // Dark downward dendritic streak
        const streakX = 110 + Math.sin(y * 0.08) * 12 + (y - 60) * 0.25;
        if (y > 60 && y < 190 && Math.abs(x - streakX) < 4 + (y - 60) * 0.05) {
          baseVal = 0.12; // dark recurrent slope linea
          reconVal = 0.48; // autoencoder predicts baseline slope
          anomalyDelta = 0.79;
        }
      } else if (sample.visualPattern === 'polar_pit') {
        // Scalloped circular sublimation scarp
        const pitDist = Math.hypot(x - 113, y - 113);
        if (pitDist > 30 && pitDist < 50) {
          baseVal = 0.08; // deep shadowed pit wall
          reconVal = 0.38;
          anomalyDelta = 0.65;
        } else if (pitDist <= 30) {
          baseVal = 0.85; // bright frost floor
          reconVal = 0.45;
          anomalyDelta = 0.58;
        }
      } else if (sample.visualPattern === 'crater_melt') {
        // Central glass pool
        const meltDist = Math.hypot(x - 110, y - 120);
        if (meltDist < 28) {
          baseVal = 0.72 + (random() - 0.5) * 0.04; // glassy reflective surface
          reconVal = 0.44;
          anomalyDelta = 0.56;
        }
      }

      // Calculate absolute reconstruction error Δ = |I - Î|
      const rawDelta = Math.abs(baseVal - reconVal);
      const errorIntensity = Math.min(1.0, Math.max(0, rawDelta * 1.5 + anomalyDelta * 0.4));

      // 1. Original I
      const origDN = Math.round(baseVal * 255);
      origImgData.data[idx] = origDN;
      origImgData.data[idx + 1] = origDN;
      origImgData.data[idx + 2] = origDN;
      origImgData.data[idx + 3] = 255;

      // 2. Reconstructed Î
      const reconDN = Math.round(reconVal * 255);
      reconImgData.data[idx] = reconDN;
      reconImgData.data[idx + 1] = reconDN;
      reconImgData.data[idx + 2] = reconDN;
      reconImgData.data[idx + 3] = 255;

      // 3. Error Heatmap Δ
      const [hr, hg, hb] = getColormapRgb(errorIntensity, colormap);
      diffImgData.data[idx] = hr;
      diffImgData.data[idx + 1] = hg;
      diffImgData.data[idx + 2] = hb;
      diffImgData.data[idx + 3] = 255;

      // Sample down for 3D relief mesh (64x64 grid)
      const mx = Math.floor((x / (size - 1)) * (meshDim - 1));
      const my = Math.floor((y / (size - 1)) * (meshDim - 1));
      if (mx >= 0 && mx < meshDim && my >= 0 && my < meshDim) {
        if (errorIntensity > heightmapGrid[my][mx]) {
          heightmapGrid[my][mx] = errorIntensity;
        }
        origGrid[my][mx] = baseVal;
        reconGrid[my][mx] = reconVal;
      }
    }
  }

  orig.ctx.putImageData(origImgData, 0, 0);
  recon.ctx.putImageData(reconImgData, 0, 0);
  diff.ctx.putImageData(diffImgData, 0, 0);

  return {
    originalDataUrl: orig.canvas.toDataURL(),
    reconstructedDataUrl: recon.canvas.toDataURL(),
    heatmapDataUrl: diff.canvas.toDataURL(),
    heightmapGrid,
    origGrid,
    reconGrid,
  };
}
