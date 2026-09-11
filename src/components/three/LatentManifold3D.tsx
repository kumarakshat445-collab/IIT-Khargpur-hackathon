import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AnomalySample } from '../../types';
import { generateManifoldPoints, ManifoldPoint } from '../../data/marsDataset';

interface LatentManifold3DProps {
  selectedSample: AnomalySample | null;
  onSelectSample: (sample: AnomalySample) => void;
  anomalies: AnomalySample[];
}

export const LatentManifold3D: React.FC<LatentManifold3DProps> = ({
  selectedSample,
  onSelectSample,
  anomalies,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showNominal, setShowNominal] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<ManifoldPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsGroupRef = useRef<THREE.Group | null>(null);
  const nominalPointsRef = useRef<THREE.Points | null>(null);
  const anomalyMeshesRef = useRef<THREE.Mesh[]>([]);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(16, 12, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lights
    const amb = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(amb);
    const dir = new THREE.DirectionalLight(0x38bdf8, 1.5);
    dir.position.set(10, 20, 10);
    scene.add(dir);

    // Coordinates grid and bounding wireframe box
    const gridHelper = new THREE.GridHelper(20, 10, 0x334155, 0x1e293b);
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    // Bounding hull box for manifold
    const boxGeo = new THREE.BoxGeometry(22, 18, 22);
    const boxMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.15 });
    const wireBox = new THREE.LineSegments(new THREE.WireframeGeometry(boxGeo), boxMat);
    scene.add(wireBox);

    // Group for points
    const pointsGroup = new THREE.Group();
    scene.add(pointsGroup);
    pointsGroupRef.current = pointsGroup;

    // Load dataset manifold points
    const allPoints = generateManifoldPoints();

    // 1. Nominal Point Cloud
    const nominalCoords: number[] = [];
    const nominalColors: number[] = [];
    const nominalData: ManifoldPoint[] = [];

    allPoints
      .filter((p) => !p.isAnomaly)
      .forEach((p) => {
        nominalCoords.push(p.x, p.y, p.z);
        // Soft blue/slate color for nominal cluster
        nominalColors.push(0.2, 0.55, 0.75);
        nominalData.push(p);
      });

    const nominalGeo = new THREE.BufferGeometry();
    nominalGeo.setAttribute('position', new THREE.Float32BufferAttribute(nominalCoords, 3));
    nominalGeo.setAttribute('color', new THREE.Float32BufferAttribute(nominalColors, 3));
    const nominalMat = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });
    const nominalMesh = new THREE.Points(nominalGeo, nominalMat);
    nominalMesh.userData = { points: nominalData };
    pointsGroup.add(nominalMesh);
    nominalPointsRef.current = nominalMesh;

    // 2. Anomaly Meshes (Distinct Spheres with glowing materials for anomalies)
    const anomalyMeshes: THREE.Mesh[] = [];
    allPoints
      .filter((p) => p.isAnomaly)
      .forEach((p) => {
        const geo = new THREE.SphereGeometry(0.55, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: p.score > 0.9 ? 0xef4444 : 0xf59e0b,
          emissive: p.score > 0.9 ? 0xdc2626 : 0xd97706,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(p.x, p.y, p.z);
        mesh.userData = { point: p };

        // Outer halo ring
        const ringGeo = new THREE.RingGeometry(0.7, 0.85, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.lookAt(camera.position);
        mesh.add(ring);

        pointsGroup.add(mesh);
        anomalyMeshes.push(mesh);
      });
    anomalyMeshesRef.current = anomalyMeshes;

    // Raycasting for point hover and selection
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.6 };
    const mouse = new THREE.Vector2();

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check anomalies first
      const anomalyIntersects = raycaster.intersectObjects(anomalyMeshesRef.current);
      if (anomalyIntersects.length > 0) {
        const p = anomalyIntersects[0].object.userData.point as ManifoldPoint;
        setHoveredPoint(p);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        container.style.cursor = 'pointer';
        return;
      }

      // Check nominal points
      if (nominalPointsRef.current) {
        const intersects = raycaster.intersectObject(nominalPointsRef.current);
        if (intersects.length > 0 && intersects[0].index !== undefined) {
          const idx = intersects[0].index;
          const p = nominalPointsRef.current.userData.points[idx];
          if (p) {
            setHoveredPoint(p);
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            container.style.cursor = 'pointer';
            return;
          }
        }
      }

      setHoveredPoint(null);
      container.style.cursor = 'grab';
    };

    const onClick = () => {
      if (hoveredPoint) {
        const matchingAnomaly = anomalies.find((a) => a.id === hoveredPoint.id);
        if (matchingAnomaly) {
          onSelectSample(matchingAnomaly);
        }
      }
    };

    // Manual mouse drag rotation
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };
    const onMouseMoveDrag = (e: MouseEvent) => {
      if (!isDragging || !pointsGroupRef.current) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      pointsGroupRef.current.rotation.y += dx * 0.006;
      pointsGroupRef.current.rotation.x += dy * 0.006;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.multiplyScalar(e.deltaY > 0 ? 1.05 : 0.95);
    };

    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMoveDrag);
    container.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);

      // Subtle ambient rotation if not user dragging
      if (!isDragging && pointsGroupRef.current) {
        pointsGroupRef.current.rotation.y += 0.0015;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMoveDrag);
      container.removeEventListener('wheel', onWheel);
      renderer.dispose();
    };
  }, [anomalies, onSelectSample, hoveredPoint]);

  // Toggle show/hide nominal points
  useEffect(() => {
    if (nominalPointsRef.current) {
      nominalPointsRef.current.visible = showNominal;
    }
  }, [showNominal]);

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(16, 12, 18);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80 shadow-2xl flex flex-col">
      <div ref={containerRef} className="w-full h-full flex-1 relative cursor-grab active:cursor-grabbing" />

      {/* Header Overlay */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2 bg-neutral-900/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-neutral-700/60 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-300">
            256-D Latent Manifold &rarr; 3D Projection
          </span>
        </div>
        <div className="text-[11px] font-mono text-neutral-400 bg-black/60 px-2.5 py-1 rounded border border-neutral-800">
          Nominal samples cluster near origin | Anomalies diverge to periphery
        </div>
      </div>

      {/* Control Bar (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setShowNominal(!showNominal)}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-all ${
            showNominal
              ? 'bg-neutral-900/80 text-cyan-300 border-cyan-700'
              : 'bg-neutral-900/80 text-neutral-400 border-neutral-700 hover:text-white'
          }`}
        >
          {showNominal ? 'Nominal Points: Shown' : 'Nominal: Hidden'}
        </button>
        <button
          onClick={resetCamera}
          className="px-3 py-1.5 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800 hover:text-white"
        >
          Reset View
        </button>
      </div>

      {/* Tooltip on Hover */}
      {hoveredPoint && tooltipPos && (
        <div
          className="absolute z-20 bg-neutral-900/95 backdrop-blur-md border border-cyan-500/60 p-3 rounded-xl shadow-xl pointer-events-none text-xs font-mono"
          style={{
            left: `${Math.min(window.innerWidth - 300, tooltipPos.x + 15)}px`,
            top: `${Math.max(10, tooltipPos.y - 40)}px`,
          }}
        >
          <div className="text-cyan-400 font-bold">{hoveredPoint.id}</div>
          <div className="text-neutral-300 text-[11px] mt-0.5">{hoveredPoint.type}</div>
          <div className="mt-1.5 pt-1.5 border-t border-neutral-800 flex items-center justify-between gap-4">
            <span className="text-neutral-400">Anomaly Score:</span>
            <span
              className={`font-semibold ${
                hoveredPoint.score > 0.815 ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {hoveredPoint.score.toFixed(3)}
            </span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {hoveredPoint.isAnomaly ? 'Click to inspect in Anomaly Explorer' : 'Nominal manifold cluster point'}
          </div>
        </div>
      )}

      {/* Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 p-3 rounded-xl flex items-center gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span className="text-neutral-300">Nominal Cluster</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-neutral-300">Marginal Outlier</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span className="text-neutral-300">Extreme Anomaly (&gt; &tau;)</span>
        </div>
      </div>
    </div>
  );
};
