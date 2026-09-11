import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnomalySample } from '../../types';

interface MarsGlobeProps {
  anomalies: AnomalySample[];
  selectedAnomaly: AnomalySample | null;
  onSelectAnomaly: (anomaly: AnomalySample) => void;
  flyToTrigger?: number;
}

// Convert Lat/Lon (degrees) to 3D Cartesian coordinates on sphere of radius R
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate realistic procedural Mars texture on offscreen canvas
function createProceduralMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base Martian terracotta gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#e5e7eb'); // North Polar Cap (white-ice)
  grad.addColorStop(0.08, '#c2410c'); // North plains
  grad.addColorStop(0.35, '#9a3412'); // Acidalia / Chryse
  grad.addColorStop(0.5, '#7c2d12'); // Equatorial highlands
  grad.addColorStop(0.65, '#451a03'); // Dark maria (Syrtis Major)
  grad.addColorStop(0.92, '#9a3412'); // Southern highlands
  grad.addColorStop(1.0, '#f3f4f6'); // South Polar Cap (ice)
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);

  // Add terrain noise, craters, and canyon lines
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Valles Marineris canyon rift
  ctx.strokeStyle = '#270e04';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(320, 260);
  ctx.bezierCurveTo(400, 275, 480, 255, 540, 280);
  ctx.stroke();

  // Dark albedo patches (Syrtis Major, Terra Sabaea)
  ctx.fillStyle = 'rgba(40, 15, 5, 0.45)';
  for (let i = 0; i < 28; i++) {
    const x = rand() * 1024;
    const y = 100 + rand() * 312;
    const rx = 30 + rand() * 80;
    const ry = 15 + rand() * 40;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Impact craters
  for (let i = 0; i < 60; i++) {
    const cx = rand() * 1024;
    const cy = rand() * 512;
    const cr = 4 + rand() * 18;
    ctx.strokeStyle = 'rgba(230, 120, 70, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(20, 8, 2, 0.35)';
    ctx.beginPath();
    ctx.arc(cx, cy, cr * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export const MarsGlobe3D: React.FC<MarsGlobeProps> = ({
  anomalies,
  selectedAnomaly,
  onSelectAnomaly,
  flyToTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraMode, setCameraMode] = useState<'orbit' | 'chase'>('orbit');
  const [hoveredAnomaly, setHoveredAnomaly] = useState<AnomalySample | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const pinGroupRef = useRef<THREE.Group | null>(null);
  const satelliteRef = useRef<THREE.Group | null>(null);
  const scanBeamRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const targetCamPosRef = useRef<THREE.Vector3 | null>(null);

  const GLOBE_RADIUS = 5.0;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 500;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 13);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff1e6, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(20, 10, 15);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x00d2ff, 0.7);
    rimLight.position.set(-15, -5, -15);
    scene.add(rimLight);

    // 5. Starfield / Deep Space backdrop
    const starGeo = new THREE.BufferGeometry();
    const starCoords: number[] = [];
    for (let i = 0; i < 700; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const z = (Math.random() - 0.5) * 200;
      starCoords.push(x, y, z);
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x94a3b8, size: 0.8, transparent: true, opacity: 0.6 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 6. Mars Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // Mars Surface Sphere
    const marsTexture = createProceduralMarsTexture();
    const marsGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const marsMat = new THREE.MeshStandardMaterial({
      map: marsTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const marsMesh = new THREE.Mesh(marsGeo, marsMat);
    globeGroup.add(marsMesh);

    // Subtle Martian Atmosphere glow
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.025, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // Optional Lat/Lon Grid lines
    const gridMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15 });
    const gridGroup = new THREE.Group();
    // Parallels (Latitude rings)
    for (let lat = -60; lat <= 60; lat += 30) {
      const latRad = (lat * Math.PI) / 180;
      const r = GLOBE_RADIUS * Math.cos(latRad) * 1.002;
      const y = GLOBE_RADIUS * Math.sin(latRad) * 1.002;
      const ringGeo = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.1) {
        pts.push(r * Math.cos(theta), y, r * Math.sin(theta));
      }
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      gridGroup.add(new THREE.Line(ringGeo, gridMat));
    }
    // Meridians (Longitude lines)
    for (let lon = 0; lon < 180; lon += 45) {
      const lonRad = (lon * Math.PI) / 180;
      const ringGeo = new THREE.BufferGeometry();
      const pts: number[] = [];
      for (let t = 0; t <= Math.PI * 2; t += 0.08) {
        const x = GLOBE_RADIUS * Math.cos(t) * Math.sin(lonRad) * 1.002;
        const y = GLOBE_RADIUS * Math.sin(t) * 1.002;
        const z = GLOBE_RADIUS * Math.cos(t) * Math.cos(lonRad) * 1.002;
        pts.push(x, y, z);
      }
      ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      gridGroup.add(new THREE.Line(ringGeo, gridMat));
    }
    globeGroup.add(gridGroup);

    // 7. Anomaly Pins
    const pinGroup = new THREE.Group();
    globeGroup.add(pinGroup);
    pinGroupRef.current = pinGroup;

    anomalies.forEach((anomaly) => {
      const pos = latLonToVector3(anomaly.coordinates.lat, anomaly.coordinates.lon, GLOBE_RADIUS * 1.01);

      // Core glowing marker
      const markerGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const isTopAnomaly = anomaly.rank === 1;
      const markerMat = new THREE.MeshStandardMaterial({
        color: isTopAnomaly ? 0xff2222 : anomaly.evtStatus === 'ABOVE_TAU' ? 0xf97316 : 0x06b6d4,
        emissive: isTopAnomaly ? 0xff0000 : anomaly.evtStatus === 'ABOVE_TAU' ? 0xea580c : 0x0891b2,
        emissiveIntensity: 0.9,
      });
      const markerMesh = new THREE.Mesh(markerGeo, markerMat);
      markerMesh.position.copy(pos);
      markerMesh.userData = { anomaly };

      // Outer targeting ring
      const ringGeo = new THREE.RingGeometry(0.18, 0.24, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isTopAnomaly ? 0xff4444 : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos.clone().multiplyScalar(1.005));
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      markerMesh.add(ringMesh);

      pinGroup.add(markerMesh);
    });

    // 8. MRO Spacecraft & Orbit Track
    const orbitRadius = GLOBE_RADIUS * 1.45;
    const orbitTrackGeo = new THREE.BufferGeometry();
    const trackPts: number[] = [];
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
      trackPts.push(orbitRadius * Math.cos(t), orbitRadius * Math.sin(t) * 0.85, orbitRadius * Math.sin(t) * 0.4);
    }
    orbitTrackGeo.setAttribute('position', new THREE.Float32BufferAttribute(trackPts, 3));
    const orbitTrackMat = new THREE.LineDashedMaterial({
      color: 0x00f0ff,
      dashSize: 0.3,
      gapSize: 0.15,
      transparent: true,
      opacity: 0.5,
    });
    const orbitTrack = new THREE.Line(orbitTrackGeo, orbitTrackMat);
    orbitTrack.computeLineDistances();
    scene.add(orbitTrack);

    // Satellite model (HiRISE on MRO)
    const satGroup = new THREE.Group();
    // Satellite main bus
    const busGeo = new THREE.BoxGeometry(0.3, 0.3, 0.4);
    const busMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }); // Gold foil
    const bus = new THREE.Mesh(busGeo, busMat);
    satGroup.add(bus);

    // Solar panels
    const panelGeo = new THREE.BoxGeometry(1.4, 0.02, 0.4);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
    const solarPanels = new THREE.Mesh(panelGeo, panelMat);
    satGroup.add(solarPanels);

    // HiRISE optical telescope barrel pointing nadir
    const teleGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.35, 16);
    const teleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 });
    const tele = new THREE.Mesh(teleGeo, teleMat);
    tele.rotation.x = Math.PI / 2;
    tele.position.y = -0.15;
    satGroup.add(tele);

    scene.add(satGroup);
    satelliteRef.current = satGroup;

    // Scanning laser/radar cone
    const beamGeo = new THREE.ConeGeometry(1.2, orbitRadius - GLOBE_RADIUS, 32, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    const scanBeam = new THREE.Mesh(beamGeo, beamMat);
    scanBeam.rotation.x = Math.PI;
    scanBeam.position.y = -(orbitRadius - GLOBE_RADIUS) * 0.5;
    satGroup.add(scanBeam);
    scanBeamRef.current = scanBeam;

    // 9. Interaction: Raycaster for Anomaly Clicks & Hover
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (pinGroupRef.current) {
        const intersects = raycaster.intersectObjects(pinGroupRef.current.children, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.userData?.anomaly) {
            obj = obj.parent;
          }
          if (obj?.userData?.anomaly) {
            setHoveredAnomaly(obj.userData.anomaly);
            container.style.cursor = 'pointer';
            return;
          }
        }
      }
      setHoveredAnomaly(null);
      container.style.cursor = 'grab';
    };

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      if (pinGroupRef.current) {
        const intersects = raycaster.intersectObjects(pinGroupRef.current.children, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.userData?.anomaly) {
            obj = obj.parent;
          }
          if (obj?.userData?.anomaly) {
            onSelectAnomaly(obj.userData.anomaly);
          }
        }
      }
    };

    // Orbit drag controls (manual rotation)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleMouseMoveDrag = (e: MouseEvent) => {
      if (!isDragging || !globeGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      globeGroupRef.current.rotation.y += deltaX * 0.005;
      globeGroupRef.current.rotation.x += deltaY * 0.005;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.min(22, Math.max(7, cameraRef.current.position.z + e.deltaY * 0.01));
    };

    container.addEventListener('mousemove', handlePointerMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMoveDrag);
    container.addEventListener('click', handleClick);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Handle window resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let orbitAngle = 0;
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Auto globe spin if enabled and not user dragging
      if (autoRotate && globeGroupRef.current && !isDragging) {
        globeGroupRef.current.rotation.y += 0.002;
      }

      // Orbit spacecraft
      orbitAngle += 0.012;
      if (satelliteRef.current) {
        const satX = orbitRadius * Math.cos(orbitAngle);
        const satY = orbitRadius * Math.sin(orbitAngle) * 0.85;
        const satZ = orbitRadius * Math.sin(orbitAngle) * 0.4;
        satelliteRef.current.position.set(satX, satY, satZ);
        satelliteRef.current.lookAt(0, 0, 0);

        // Pulse scanning beam opacity
        if (scanBeamRef.current) {
          (scanBeamRef.current.material as THREE.MeshBasicMaterial).opacity =
            0.15 + Math.sin(orbitAngle * 4) * 0.08;
        }
      }

      // Smooth camera interpolation towards target (Fly-to anomaly)
      if (targetCamPosRef.current && cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPosRef.current, 0.05);
        cameraRef.current.lookAt(0, 0, 0);
        if (cameraRef.current.position.distanceTo(targetCamPosRef.current) < 0.1) {
          targetCamPosRef.current = null;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handlePointerMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMoveDrag);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('wheel', handleWheel);
      renderer.dispose();
    };
  }, [anomalies, onSelectAnomaly]);

  // Handle fly-to trigger or selected anomaly change
  useEffect(() => {
    if (!selectedAnomaly || !globeGroupRef.current) return;
    // Calculate 3D position of anomaly
    const p = latLonToVector3(
      selectedAnomaly.coordinates.lat,
      selectedAnomaly.coordinates.lon,
      GLOBE_RADIUS
    );
    // Align camera towards anomaly on surface
    const norm = p.clone().normalize();
    targetCamPosRef.current = norm.multiplyScalar(9.5);
  }, [selectedAnomaly, flyToTrigger]);

  const handleResetView = () => {
    if (cameraRef.current) {
      targetCamPosRef.current = new THREE.Vector3(0, 4, 13);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80 shadow-2xl flex flex-col">
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Overlays */}
      <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1.5 z-10">
        <div className="flex items-center gap-2 bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-700/60 shadow-lg">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-300">
            HiRISE Orbiter: 284 km SSO
          </span>
        </div>
        <div className="text-[11px] font-mono text-neutral-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-neutral-800/80">
          Target Lat/Lon: {selectedAnomaly ? `${selectedAnomaly.coordinates.lat.toFixed(2)}°, ${selectedAnomaly.coordinates.lon.toFixed(2)}°` : 'Awaiting Target'}
        </div>
      </div>

      {/* Control Buttons (Bottom Right) */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
            autoRotate
              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700'
              : 'bg-neutral-900/80 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
        >
          {autoRotate ? 'Rotation: ON' : 'Rotation: PAUSED'}
        </button>
        <button
          onClick={handleResetView}
          className="px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
        >
          Reset Camera
        </button>
      </div>

      {/* Hovered Anomaly Tooltip */}
      {hoveredAnomaly && (
        <div className="absolute top-4 right-4 z-20 bg-neutral-900/90 backdrop-blur-md border border-amber-500/50 p-3 rounded-xl shadow-xl max-w-xs pointer-events-none">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
            Anomaly Detected #{hoveredAnomaly.rank}
          </div>
          <div className="text-xs font-semibold text-white mt-0.5">{hoveredAnomaly.title}</div>
          <div className="text-[11px] text-neutral-400 mt-1">{hoveredAnomaly.locationName}</div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800 font-mono text-[10px]">
            <span className="text-neutral-400">Score: {hoveredAnomaly.anomalyScore.toFixed(3)}</span>
            <span className={`font-semibold ${hoveredAnomaly.evtStatus === 'ABOVE_TAU' ? 'text-red-400' : 'text-cyan-400'}`}>
              {hoveredAnomaly.evtStatus === 'ABOVE_TAU' ? 'Above τ (EVT Flagged)' : 'Tail Marginal'}
            </span>
          </div>
        </div>
      )}

      {/* Selected Anomaly Badge */}
      {selectedAnomaly && (
        <div className="absolute bottom-4 left-4 z-10 bg-neutral-900/90 backdrop-blur-md border border-neutral-700/80 px-4 py-2.5 rounded-xl shadow-xl max-w-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-mono text-neutral-200 uppercase font-semibold">
              Waypoint: {selectedAnomaly.id}
            </span>
          </div>
          <div className="text-xs text-neutral-400 mt-0.5">{selectedAnomaly.locationName}</div>
        </div>
      )}
    </div>
  );
};
