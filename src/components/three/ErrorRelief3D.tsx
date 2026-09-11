import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { AnomalySample, HeatmapColormap } from '../../types';
import { getColormapRgb } from '../../services/imageSynthesizer';
import {
  Eye,
  Layers,
  RotateCcw,
  Compass,
  Crosshair,
  Activity,
  Sliders,
  Sun,
  Maximize2,
  Minimize2,
  TrendingUp,
  Flame,
  Grid,
} from 'lucide-react';

interface ErrorRelief3DProps {
  heightmapGrid: number[][]; // 2D matrix of error intensities [0.0 - 1.0]
  origGrid?: number[][];
  reconGrid?: number[][];
  sample: AnomalySample;
  colormap?: HeatmapColormap;
  originalTextureUrl?: string;
  tau?: number;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

type SurfaceRenderMode = 'colormap' | 'textured' | 'wireframe' | 'hybrid';
type CameraAnglePreset = 'oblique' | 'nadir' | 'horizon' | 'corner';

export const ErrorRelief3D: React.FC<ErrorRelief3DProps> = ({
  heightmapGrid,
  origGrid,
  reconGrid,
  sample,
  colormap = 'inferno',
  originalTextureUrl,
  tau = 0.815,
  fullscreen = false,
  onToggleFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderMode, setRenderMode] = useState<SurfaceRenderMode>('colormap');
  const [heightExaggeration, setHeightExaggeration] = useState<number>(3.2);
  const [showTauPlane, setShowTauPlane] = useState<boolean>(true);
  const [showBasePedestal, setShowBasePedestal] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<CameraAnglePreset>('oblique');

  // Transect slicing state
  const [showTransect, setShowTransect] = useState<boolean>(true);
  const [transectAxis, setTransectAxis] = useState<'X' | 'Y'>('Y');
  const [transectIndex, setTransectIndex] = useState<number>(32); // index in grid [0, 63]

  // Hover Probe Telemetry
  const [probeData, setProbeData] = useState<{
    pixelX: number;
    pixelY: number;
    errorDelta: number;
    origDN: number;
    reconDN: number;
    elevationMeters: number;
    isExceedance: boolean;
  } | null>(null);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const tauPlaneMeshRef = useRef<THREE.Mesh | null>(null);
  const transectLineMeshRef = useRef<THREE.Line | null>(null);
  const probeMarkerRef = useRef<THREE.Group | null>(null);
  const pedestalGroupRef = useRef<THREE.Group | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Derive Peak and Statistical Metrics from heightmap
  const stats = useMemo(() => {
    if (!heightmapGrid || heightmapGrid.length === 0) {
      return { maxDelta: 0, meanDelta: 0, exceedanceRatio: 0, peakCoords: [0, 0] };
    }
    let max = -1;
    let sum = 0;
    let count = 0;
    let exceedCount = 0;
    let peakR = 0;
    let peakC = 0;

    for (let r = 0; r < heightmapGrid.length; r++) {
      for (let c = 0; c < heightmapGrid[r].length; c++) {
        const v = heightmapGrid[r][c] || 0;
        sum += v;
        count++;
        if (v >= tau) exceedCount++;
        if (v > max) {
          max = v;
          peakR = r;
          peakC = c;
        }
      }
    }
    return {
      maxDelta: max,
      meanDelta: sum / (count || 1),
      exceedanceRatio: (exceedCount / (count || 1)) * 100,
      peakCoords: [Math.round((peakC / 63) * 226), Math.round((peakR / 63) * 226)],
    };
  }, [heightmapGrid, tau]);

  // Extract 1D transect profile curve for bottom HUD
  const transectProfile = useMemo(() => {
    if (!heightmapGrid || heightmapGrid.length === 0) return [];
    const rows = heightmapGrid.length;
    const cols = heightmapGrid[0].length;
    const profile: { pos: number; delta: number; isOverTau: boolean }[] = [];

    if (transectAxis === 'Y') {
      // Row slice across columns
      const r = Math.min(rows - 1, Math.max(0, transectIndex));
      for (let c = 0; c < cols; c++) {
        const d = heightmapGrid[r][c] || 0;
        profile.push({
          pos: Math.round((c / (cols - 1)) * 226),
          delta: d,
          isOverTau: d >= tau,
        });
      }
    } else {
      // Column slice across rows
      const c = Math.min(cols - 1, Math.max(0, transectIndex));
      for (let r = 0; r < rows; r++) {
        const d = heightmapGrid[r][c] || 0;
        profile.push({
          pos: Math.round((r / (rows - 1)) * 226),
          delta: d,
          isOverTau: d >= tau,
        });
      }
    }
    return profile;
  }, [heightmapGrid, transectAxis, transectIndex, tau]);

  // Initialize and Update Three.js Scene
  useEffect(() => {
    if (!containerRef.current || !heightmapGrid || heightmapGrid.length === 0) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 18, 24);
    camera.lookAt(0, 2, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting (Synthesizing HiRISE Solar Vector)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // HiRISE sun direction based on solarZenithAngle
    const szaRad = ((sample.solarZenithAngle || 55) * Math.PI) / 180;
    const sunDist = 30;
    const sunX = Math.sin(szaRad) * sunDist;
    const sunY = Math.cos(szaRad) * sunDist;
    const sunZ = 12;

    const sunLight = new THREE.DirectionalLight(0xfff1db, 2.2);
    sunLight.position.set(sunX, sunY, sunZ);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 80;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Fill blue light for Mars atmospheric contrast
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
    fillLight.position.set(-18, 12, -16);
    scene.add(fillLight);

    // 5. Construct 3D Error Terrain Mesh
    const rows = heightmapGrid.length;
    const cols = heightmapGrid[0].length;
    const planeWidth = 20;
    const planeDepth = 20;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeDepth, cols - 1, rows - 1);
    geometry.rotateX(-Math.PI / 2); // Orient on XZ plane with Y as height

    const posAttr = geometry.attributes.position;
    const colors: number[] = [];

    const activeColormap = (colormap as HeatmapColormap) || 'inferno';
    // Assign Heights (Y = Δ * heightExaggeration) and Scientific Colormap Vertex Colors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const errVal = heightmapGrid[r][c] || 0;
        const elev = errVal * heightExaggeration;
        posAttr.setY(idx, elev);

        const [cr, cg, cb] = getColormapRgb(errVal, activeColormap);
        colors.push(cr / 255, cg / 255, cb / 255);
      }
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    // Material definition
    let material: THREE.Material;
    if (renderMode === 'textured' && originalTextureUrl) {
      const loader = new THREE.TextureLoader();
      const texture = loader.load(originalTextureUrl);
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });
    } else if (renderMode === 'wireframe') {
      material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        wireframe: true,
      });
    } else if (renderMode === 'hybrid') {
      material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.35,
        metalness: 0.15,
        wireframe: false,
        side: THREE.DoubleSide,
      });
    } else {
      // Default Colormap Surface
      material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.4,
        metalness: 0.15,
        side: THREE.DoubleSide,
      });
    }

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = true;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Optional Hybrid Wireframe Overlay
    if (renderMode === 'hybrid') {
      const wireGeo = geometry.clone();
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      wireMesh.position.y += 0.02;
      terrainMesh.add(wireMesh);
    }

    // 6. Geological Base Pedestal / Skirt (Extrusion down to ground)
    const pedestalGroup = new THREE.Group();
    if (showBasePedestal) {
      // Skirt walls along 4 borders to anchor the terrain
      const skirtMat = new THREE.MeshStandardMaterial({
        color: 0x181a20,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide,
      });

      const skirtDepth = -1.2;
      // North & South skirts
      for (let side = 0; side < 2; side++) {
        const r = side === 0 ? 0 : rows - 1;
        const skirtGeo = new THREE.BufferGeometry();
        const skirtVerts: number[] = [];
        for (let c = 0; c < cols - 1; c++) {
          const idxA = r * cols + c;
          const idxB = r * cols + c + 1;
          const xA = posAttr.getX(idxA);
          const yA = posAttr.getY(idxA);
          const zA = posAttr.getZ(idxA);
          const xB = posAttr.getX(idxB);
          const yB = posAttr.getY(idxB);
          const zB = posAttr.getZ(idxB);

          // Quad split into 2 triangles
          skirtVerts.push(xA, yA, zA, xB, yB, zB, xA, skirtDepth, zA);
          skirtVerts.push(xB, yB, zB, xB, skirtDepth, zB, xA, skirtDepth, zA);
        }
        skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtVerts, 3));
        skirtGeo.computeVertexNormals();
        pedestalGroup.add(new THREE.Mesh(skirtGeo, skirtMat));
      }

      // East & West skirts
      for (let side = 0; side < 2; side++) {
        const c = side === 0 ? 0 : cols - 1;
        const skirtGeo = new THREE.BufferGeometry();
        const skirtVerts: number[] = [];
        for (let r = 0; r < rows - 1; r++) {
          const idxA = r * cols + c;
          const idxB = (r + 1) * cols + c;
          const xA = posAttr.getX(idxA);
          const yA = posAttr.getY(idxA);
          const zA = posAttr.getZ(idxA);
          const xB = posAttr.getX(idxB);
          const yB = posAttr.getY(idxB);
          const zB = posAttr.getZ(idxB);

          skirtVerts.push(xA, yA, zA, xA, skirtDepth, zA, xB, yB, zB);
          skirtVerts.push(xB, yB, zB, xA, skirtDepth, zA, xB, skirtDepth, zB);
        }
        skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtVerts, 3));
        skirtGeo.computeVertexNormals();
        pedestalGroup.add(new THREE.Mesh(skirtGeo, skirtMat));
      }

      // Pedestal Base Slab
      const baseSlabGeo = new THREE.BoxGeometry(planeWidth + 0.4, 0.4, planeDepth + 0.4);
      const baseSlabMat = new THREE.MeshStandardMaterial({
        color: 0x111318,
        roughness: 0.8,
        metalness: 0.2,
      });
      const baseSlab = new THREE.Mesh(baseSlabGeo, baseSlabMat);
      baseSlab.position.y = skirtDepth - 0.2;
      pedestalGroup.add(baseSlab);

      // Tech Grid Floor
      const gridHelper = new THREE.GridHelper(30, 20, 0x06b6d4, 0x1e293b);
      gridHelper.position.y = skirtDepth - 0.41;
      pedestalGroup.add(gridHelper);

      scene.add(pedestalGroup);
      pedestalGroupRef.current = pedestalGroup;
    }

    // 7. EVT Decision Boundary Surface (τ-Plane)
    if (showTauPlane) {
      const tauElevation = tau * heightExaggeration;
      const tauGeo = new THREE.PlaneGeometry(planeWidth + 0.6, planeDepth + 0.6);
      tauGeo.rotateX(-Math.PI / 2);

      const tauMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.22,
        roughness: 0.2,
        metalness: 0.8,
        side: THREE.DoubleSide,
      });
      const tauMesh = new THREE.Mesh(tauGeo, tauMat);
      tauMesh.position.y = tauElevation;

      // Laser perimeter border for the τ plane
      const borderGeo = new THREE.EdgesGeometry(tauGeo);
      const borderMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        linewidth: 2,
      });
      const borderLine = new THREE.LineSegments(borderGeo, borderMat);
      tauMesh.add(borderLine);

      scene.add(tauMesh);
      tauPlaneMeshRef.current = tauMesh;
    }

    // 8. Transect Slice Indicator Line in 3D
    if (showTransect) {
      const linePts: THREE.Vector3[] = [];
      const halfW = planeWidth / 2;
      const halfD = planeDepth / 2;

      if (transectAxis === 'Y') {
        const r = Math.min(rows - 1, Math.max(0, transectIndex));
        for (let c = 0; c < cols; c++) {
          const x = (c / (cols - 1)) * planeWidth - halfW;
          const z = (r / (rows - 1)) * planeDepth - halfD;
          const y = (heightmapGrid[r][c] || 0) * heightExaggeration + 0.08;
          linePts.push(new THREE.Vector3(x, y, z));
        }
      } else {
        const c = Math.min(cols - 1, Math.max(0, transectIndex));
        for (let r = 0; r < rows; r++) {
          const x = (c / (cols - 1)) * planeWidth - halfW;
          const z = (r / (rows - 1)) * planeDepth - halfD;
          const y = (heightmapGrid[r][c] || 0) * heightExaggeration + 0.08;
          linePts.push(new THREE.Vector3(x, y, z));
        }
      }

      const transectGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const transectMat = new THREE.LineBasicMaterial({
        color: 0xfacc15,
        linewidth: 3,
      });
      const transectLine = new THREE.Line(transectGeo, transectMat);
      scene.add(transectLine);
      transectLineMeshRef.current = transectLine;
    }

    // 9. Interactive Laser Altimeter Probe Marker
    const probeGroup = new THREE.Group();
    // Reticle Ring
    const reticleGeo = new THREE.RingGeometry(0.3, 0.4, 32);
    reticleGeo.rotateX(-Math.PI / 2);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
    });
    const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    probeGroup.add(reticleMesh);

    // Laser vertical beam down to baseline
    const beamGeo = new THREE.CylinderGeometry(0.02, 0.02, 6, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.8,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = -3;
    probeGroup.add(beamMesh);

    probeGroup.visible = false;
    scene.add(probeGroup);
    probeMarkerRef.current = probeGroup;

    // 10. Mouse Interaction (Orbit, Pan, Raycasting)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle Camera Orbit when dragging
      if (isDragging) {
        const dx = e.clientX - prevMouseX;
        const dy = e.clientY - prevMouseY;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;

        const rotSpeed = 0.007;
        if (terrainMeshRef.current) {
          terrainMeshRef.current.rotation.y += dx * rotSpeed;
          terrainMeshRef.current.rotation.x += dy * rotSpeed * 0.5;
          // Clamp X tilt
          terrainMeshRef.current.rotation.x = Math.max(
            -Math.PI / 4,
            Math.min(Math.PI / 3, terrainMeshRef.current.rotation.x)
          );

          if (pedestalGroupRef.current) {
            pedestalGroupRef.current.rotation.y = terrainMeshRef.current.rotation.y;
            pedestalGroupRef.current.rotation.x = terrainMeshRef.current.rotation.x;
          }
          if (tauPlaneMeshRef.current) {
            tauPlaneMeshRef.current.rotation.y = terrainMeshRef.current.rotation.y;
            tauPlaneMeshRef.current.rotation.x = terrainMeshRef.current.rotation.x;
          }
          if (transectLineMeshRef.current) {
            transectLineMeshRef.current.rotation.y = terrainMeshRef.current.rotation.y;
            transectLineMeshRef.current.rotation.x = terrainMeshRef.current.rotation.x;
          }
        }
      }

      // Raycasting for surface probing
      raycaster.setFromCamera(mouseCoord, camera);
      if (terrainMeshRef.current) {
        const intersects = raycaster.intersectObject(terrainMeshRef.current);
        if (intersects.length > 0) {
          const hit = intersects[0];
          if (hit.point && hit.uv) {
            const uvX = Math.min(1, Math.max(0, hit.uv.x));
            const uvY = Math.min(1, Math.max(0, 1 - hit.uv.y));

            const gridCol = Math.min(cols - 1, Math.max(0, Math.round(uvX * (cols - 1))));
            const gridRow = Math.min(rows - 1, Math.max(0, Math.round(uvY * (rows - 1))));

            const deltaVal = heightmapGrid[gridRow]?.[gridCol] || 0;
            const origDN = Math.round((origGrid?.[gridRow]?.[gridCol] ?? 0.45) * 255);
            const reconDN = Math.round((reconGrid?.[gridRow]?.[gridCol] ?? 0.45) * 255);
            const elevationMeters = deltaVal * 48.2;

            setProbeData({
              pixelX: Math.round(uvX * 226),
              pixelY: Math.round(uvY * 226),
              errorDelta: deltaVal,
              origDN,
              reconDN,
              elevationMeters,
              isExceedance: deltaVal >= tau,
            });

            // Update 3D reticle
            if (probeMarkerRef.current) {
              probeMarkerRef.current.visible = true;
              probeMarkerRef.current.position.copy(hit.point);
              probeMarkerRef.current.position.y += 0.05;
            }
          }
        } else {
          if (!isDragging && probeMarkerRef.current) {
            probeMarkerRef.current.visible = false;
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const factor = e.deltaY > 0 ? 1.08 : 0.92;
      cameraRef.current.position.multiplyScalar(factor);
      cameraRef.current.position.clampLength(10, 60);
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    container.addEventListener('wheel', onWheel, { passive: false });

    // 11. Animation Loop
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      if (autoRotate && terrainMeshRef.current && !isDragging) {
        const deltaRot = 0.003;
        terrainMeshRef.current.rotation.y += deltaRot;
        if (pedestalGroupRef.current) pedestalGroupRef.current.rotation.y += deltaRot;
        if (tauPlaneMeshRef.current) tauPlaneMeshRef.current.rotation.y += deltaRot;
        if (transectLineMeshRef.current) transectLineMeshRef.current.rotation.y += deltaRot;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [
    heightmapGrid,
    origGrid,
    reconGrid,
    colormap,
    renderMode,
    heightExaggeration,
    showTauPlane,
    showBasePedestal,
    showTransect,
    transectAxis,
    transectIndex,
    autoRotate,
    tau,
    originalTextureUrl,
    sample,
  ]);

  // Camera Preset Switcher
  const handleApplyCameraPreset = (preset: CameraAnglePreset) => {
    setActivePreset(preset);
    if (!cameraRef.current || !terrainMeshRef.current) return;
    const camera = cameraRef.current;

    // Reset mesh rotation
    terrainMeshRef.current.rotation.set(0, 0, 0);
    if (pedestalGroupRef.current) pedestalGroupRef.current.rotation.set(0, 0, 0);
    if (tauPlaneMeshRef.current) tauPlaneMeshRef.current.rotation.set(0, 0, 0);
    if (transectLineMeshRef.current) transectLineMeshRef.current.rotation.set(0, 0, 0);

    if (preset === 'oblique') {
      camera.position.set(0, 18, 24);
      camera.lookAt(0, 2, 0);
    } else if (preset === 'nadir') {
      camera.position.set(0, 32, 0.01);
      camera.lookAt(0, 0, 0);
    } else if (preset === 'horizon') {
      camera.position.set(0, 3.5, 26);
      camera.lookAt(0, 3.5, 0);
    } else if (preset === 'corner') {
      camera.position.set(22, 17, 22);
      camera.lookAt(0, 2, 0);
    }
  };

  return (
    <div
      className={`relative w-full bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col ${
        fullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-full min-h-[580px]'
      }`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full flex-1 relative cursor-grab active:cursor-grabbing select-none"
      />

      {/* TOP HEADER OVERLAY: Title, Scientific Context & Fullscreen */}
      <div className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-neutral-700 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              3D Reconstruction Failure Terrain: &Delta;(x, y) &rarr; Height z
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-neutral-800 text-[11px] font-mono text-neutral-300">
            <span className="text-neutral-500">Sample:</span>
            <span className="text-cyan-400 font-semibold">{sample.id}</span>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-500">Peak &Delta;:</span>
            <span className="text-amber-400 font-bold">{(stats.maxDelta * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Right Action Icons: Fullscreen & Reset */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => handleApplyCameraPreset('oblique')}
            title="Reset Camera View"
            className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white transition-all shadow cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D Terrain'}
              className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 hover:text-white transition-all shadow cursor-pointer"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* FLOATING HUD: LIVE LASER ALTIMETER PROBE (Top Right) */}
      <div className="absolute top-16 right-4 z-20 pointer-events-auto w-64 max-w-full">
        <div className="bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 p-3 shadow-2xl flex flex-col gap-2 text-xs font-mono">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-1.5">
            <div className="flex items-center gap-1.5 text-neutral-300 font-bold">
              <Crosshair className="w-3.5 h-3.5 text-red-400" />
              <span>Laser Altimeter HUD</span>
            </div>
            <span className="text-[10px] text-neutral-500">Hover Terrain</span>
          </div>

          {probeData ? (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">Pixel Coord:</span>
                <span className="text-white font-bold">
                  ({probeData.pixelX}, {probeData.pixelY})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Error &Delta;(x,y):</span>
                <span
                  className={`font-bold ${
                    probeData.isExceedance ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {(probeData.errorDelta * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Equiv. Elevation:</span>
                <span className="text-cyan-300 font-semibold">
                  +{probeData.elevationMeters.toFixed(1)} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Input / Recon DN:</span>
                <span className="text-neutral-300">
                  {probeData.origDN} / {probeData.reconDN}
                </span>
              </div>
              <div className="mt-1 pt-1 border-t border-neutral-800">
                <span
                  className={`inline-block w-full text-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    probeData.isExceedance
                      ? 'bg-red-950 text-red-300 border border-red-700'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {probeData.isExceedance ? 'CRITICAL EVT EXCEEDANCE' : 'NOMINAL RECONSTRUCTION'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center text-neutral-500 text-[11px] leading-relaxed">
              Hover cursor over 3D relief surface to probe localized reconstruction error telemetry.
            </div>
          )}
        </div>
      </div>

      {/* FLOATING HUD: CAMERA PRESETS (Top Left) */}
      <div className="absolute top-16 left-4 z-20 pointer-events-auto flex flex-col gap-1.5">
        <div className="bg-neutral-900/90 backdrop-blur-md rounded-xl border border-neutral-800 p-1.5 shadow-xl flex flex-col gap-1 text-xs font-mono">
          <div className="text-[10px] font-bold text-neutral-400 px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Camera Angle</span>
          </div>
          <button
            onClick={() => handleApplyCameraPreset('oblique')}
            className={`px-2.5 py-1 rounded text-left text-[11px] transition-colors cursor-pointer ${
              activePreset === 'oblique'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Oblique 45&deg; (Isometric)
          </button>
          <button
            onClick={() => handleApplyCameraPreset('nadir')}
            className={`px-2.5 py-1 rounded text-left text-[11px] transition-colors cursor-pointer ${
              activePreset === 'nadir'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Nadir 90&deg; (Top-Down)
          </button>
          <button
            onClick={() => handleApplyCameraPreset('horizon')}
            className={`px-2.5 py-1 rounded text-left text-[11px] transition-colors cursor-pointer ${
              activePreset === 'horizon'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Horizon Profile (Side Elevation)
          </button>
          <button
            onClick={() => handleApplyCameraPreset('corner')}
            className={`px-2.5 py-1 rounded text-left text-[11px] transition-colors cursor-pointer ${
              activePreset === 'corner'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Corner Isometric
          </button>
        </div>
      </div>

      {/* BOTTOM CONTROL PANEL: Surface Modes, Exaggeration, EVT Plane, Transect Slice */}
      <div className="z-20 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 p-3.5 flex flex-col gap-3">
        {/* Main Control Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Surface Texture / Render Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-neutral-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>Surface:</span>
            </span>
            <div className="flex items-center bg-black/60 border border-neutral-800 rounded-xl p-1 font-mono text-xs">
              <button
                onClick={() => setRenderMode('colormap')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  renderMode === 'colormap'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Colormap ({colormap})
              </button>
              {originalTextureUrl && (
                <button
                  onClick={() => setRenderMode('textured')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    renderMode === 'textured'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Draped HiRISE
                </button>
              )}
              <button
                onClick={() => setRenderMode('hybrid')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  renderMode === 'hybrid'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Hybrid Solid+Wire
              </button>
              <button
                onClick={() => setRenderMode('wireframe')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  renderMode === 'wireframe'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Wireframe
              </button>
            </div>
          </div>

          {/* Height Exaggeration Slider */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-mono text-neutral-400 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Elevation Exaggeration:</span>
              <input
                type="range"
                min="0.5"
                max="7.0"
                step="0.2"
                value={heightExaggeration}
                onChange={(e) => setHeightExaggeration(parseFloat(e.target.value))}
                className="w-24 sm:w-32 accent-cyan-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
              <span className="text-white font-bold w-10">{heightExaggeration.toFixed(1)}x</span>
            </label>
          </div>

          {/* Feature Toggles: EVT Tau Plane, Base Pedestal & Auto-Rotate */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setShowTauPlane(!showTauPlane)}
              className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                showTauPlane
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-semibold'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>EVT &tau;-Plane: {showTauPlane ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setShowBasePedestal(!showBasePedestal)}
              className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                showBasePedestal
                  ? 'bg-neutral-800 text-neutral-200 border-neutral-700 font-semibold'
                  : 'bg-neutral-900 text-neutral-500 border-neutral-800'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Pedestal Block</span>
            </button>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                autoRotate
                  ? 'bg-amber-950 text-amber-300 border-amber-700 font-semibold'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Auto-Rotate</span>
            </button>

            <button
              onClick={() => setShowTransect(!showTransect)}
              className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                showTransect
                  ? 'bg-yellow-950 text-yellow-300 border-yellow-700 font-semibold'
                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Transect Slice</span>
            </button>
          </div>
        </div>

        {/* 1D TRANSECT PROFILE SLICE HUD (when showTransect is enabled) */}
        {showTransect && (
          <div className="bg-black/60 rounded-xl border border-neutral-800 p-2.5 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span className="font-bold text-white">
                  1D Cross-Section Profile Transect ({transectAxis}-Axis at index {transectIndex})
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded px-1.5 py-0.5">
                  <span className="text-[10px] text-neutral-400">Axis:</span>
                  <button
                    onClick={() => setTransectAxis('Y')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                      transectAxis === 'Y' ? 'bg-yellow-900 text-yellow-300 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Row (Y)
                  </button>
                  <button
                    onClick={() => setTransectAxis('X')}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                      transectAxis === 'X' ? 'bg-yellow-900 text-yellow-300 font-bold' : 'text-neutral-400'
                    }`}
                  >
                    Col (X)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-neutral-400">Position:</span>
                  <input
                    type="range"
                    min="0"
                    max="63"
                    value={transectIndex}
                    onChange={(e) => setTransectIndex(parseInt(e.target.value))}
                    className="w-24 accent-yellow-400 h-1 bg-neutral-700 rounded cursor-pointer"
                  />
                  <span className="text-yellow-300 text-[11px] w-6">{transectIndex}</span>
                </div>
              </div>
            </div>

            {/* Transect SVG Elevation Curve */}
            <div className="relative h-16 w-full bg-neutral-950/80 rounded-lg overflow-hidden border border-neutral-850 px-2 py-1">
              {/* Horizontal EVT Decision Line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-cyan-400 z-10"
                style={{ top: `${(1 - tau) * 100}%` }}
              >
                <span className="absolute right-2 -top-3.5 text-[9px] font-mono text-cyan-400 font-bold bg-black/80 px-1 rounded">
                  EVT Decision Boundary &tau; = {tau.toFixed(3)}
                </span>
              </div>

              {/* SVG Area and Line */}
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 60" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="transectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Filled Area */}
                {transectProfile.length > 1 && (
                  <polygon
                    points={`0,60 ${transectProfile
                      .map((pt, i) => {
                        const x = (i / (transectProfile.length - 1)) * 300;
                        const y = Math.max(0, Math.min(60, 60 - pt.delta * 60));
                        return `${x},${y}`;
                      })
                      .join(' ')} 300,60`}
                    fill="url(#transectGrad)"
                  />
                )}

                {/* Profile Line */}
                {transectProfile.length > 1 && (
                  <polyline
                    points={transectProfile
                      .map((pt, i) => {
                        const x = (i / (transectProfile.length - 1)) * 300;
                        const y = Math.max(0, Math.min(60, 60 - pt.delta * 60));
                        return `${x},${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-neutral-500 px-1">
              <span>Pixel 0 (Edge)</span>
              <span className="text-yellow-400 font-semibold">
                Transect Elevation Peak: {(Math.max(...transectProfile.map((p) => p.delta)) * 100).toFixed(1)}%
              </span>
              <span>Pixel 226 (Opposite Edge)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
