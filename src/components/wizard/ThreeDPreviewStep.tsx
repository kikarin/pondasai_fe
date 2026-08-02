import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Box } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { BetaFeatureNotice } from './BetaFeatureNotice';
import { DigitalTwinPanel } from './DigitalTwinPanel';
import { SunlightAnalysisPanel } from './SunlightAnalysisPanel';
import { VentilationAnalysisPanel } from './VentilationAnalysisPanel';
import { getLayoutDimensions, getRoomColor } from '../../utils/floorPlan';
import type { EarthquakeTwinVisual, FloodTwinVisual } from '../../types/digitalTwin';

function addEdgeHighlight(
  mesh: THREE.Mesh,
  color: number,
  group: THREE.Group,
  disposables: THREE.BufferGeometry[],
  materials: THREE.Material[],
) {
  const edges = new THREE.EdgesGeometry(mesh.geometry);
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });
  const lines = new THREE.LineSegments(edges, lineMat);
  lines.position.copy(mesh.position);
  lines.rotation.copy(mesh.rotation);
  lines.scale.copy(mesh.scale);
  group.add(lines);
  disposables.push(edges);
  materials.push(lineMat);
}

export function ThreeDPreviewStep() {
  const { houseLayout, recommendations, nextStep, coordinates, siteAnalysis } = usePondasiWorkspace();
  const mountRef = useRef<HTMLDivElement>(null);
  const [floodVisual, setFloodVisual] = useState<FloodTwinVisual | null>(null);
  const [eqVisual, setEqVisual] = useState<EarthquakeTwinVisual | null>(null);

  const onFloodVisualChange = useCallback((visual: FloodTwinVisual) => {
    setFloodVisual(visual);
  }, []);

  const onEarthquakeVisualChange = useCallback((visual: EarthquakeTwinVisual) => {
    setEqVisual(visual);
  }, []);

  useEffect(() => {
    if (!mountRef.current || !houseLayout) return;

    const mountNode = mountRef.current;
    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0D15');

    const aspect = width / height;
    const d = 10;
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 1000);
    camera.position.set(14, 14, 14);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountNode.appendChild(renderer.domElement);

    scene.add(new THREE.GridHelper(20, 20, 0x1f293d, 0x1f293d));
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(8, 16, 8);
    scene.add(dirLight);

    const { width: buildingWidth, length: buildingLength } = getLayoutDimensions(houseLayout);
    const floorElevationM = (recommendations?.floorElevation ?? 0) / 100;
    const floorCount = houseLayout.floors ?? 1;
    const wallHeight = 2.8 * floorCount;

    const group = new THREE.Group();
    const disposables: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    const foundationGeo = new THREE.BoxGeometry(buildingWidth + 0.4, 0.3, buildingLength + 0.4);
    const foundationMat = new THREE.MeshLambertMaterial({ color: 0x4b5563 });
    const foundation = new THREE.Mesh(foundationGeo, foundationMat);
    foundation.position.set(0, floorElevationM + 0.15, 0);
    group.add(foundation);
    disposables.push(foundationGeo);
    materials.push(foundationMat);

    const bodyGeo = new THREE.BoxGeometry(buildingWidth, wallHeight, buildingLength);
    const bodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.75 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, floorElevationM + 0.3 + wallHeight / 2, 0);
    group.add(body);
    disposables.push(bodyGeo);
    materials.push(bodyMat);

    let roof: THREE.Mesh | null = null;
    const roofType = houseLayout.roofType ?? 'limas';
    if (roofType === 'datar') {
      const roofGeo = new THREE.BoxGeometry(buildingWidth + 0.2, 0.2, buildingLength + 0.2);
      const roofMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, floorElevationM + 0.3 + wallHeight + 0.1, 0);
      group.add(roof);
      disposables.push(roofGeo);
      materials.push(roofMat);
    } else {
      const roofGeo = new THREE.ConeGeometry(Math.max(buildingWidth, buildingLength) * 0.65, 1.8, 4);
      const roofMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, floorElevationM + 0.3 + wallHeight + 0.9, 0);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      disposables.push(roofGeo);
      materials.push(roofMat);
    }

    if (eqVisual?.enabled) {
      const tint = new THREE.Color(eqVisual.tint);
      bodyMat.color.lerp(tint, 0.35);
      bodyMat.emissive = tint;
      bodyMat.emissiveIntensity = Math.min(0.35, eqVisual.shakeAmplitude * 2.5);

      const focusColor = 0xf59e0b;
      const recColor = 0x38bdf8;
      const ids = new Set(eqVisual.highlightIds);

      if (ids.has('confined_masonry')) {
        addEdgeHighlight(body, focusColor, group, disposables, materials);
      }
      if (ids.has('foundation_tie')) {
        addEdgeHighlight(foundation, focusColor, group, disposables, materials);
      }
      if (ids.has('ring_beam')) {
        const beamGeo = new THREE.BoxGeometry(buildingWidth + 0.15, 0.12, buildingLength + 0.15);
        const beamMat = new THREE.MeshLambertMaterial({
          color: ids.has('ring_beam') ? focusColor : recColor,
          transparent: true,
          opacity: 0.85,
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, floorElevationM + 0.3 + wallHeight - 0.05, 0);
        group.add(beam);
        disposables.push(beamGeo);
        materials.push(beamMat);
      }
      if (ids.has('light_roof') && roof) {
        addEdgeHighlight(roof, recColor, group, disposables, materials);
      }
    }

    scene.add(group);

    if (floodVisual?.enabled && floodVisual.waterHeightM > 0) {
      const waterW = Math.max(buildingWidth, 4) * 2.4;
      const waterL = Math.max(buildingLength, 4) * 2.4;
      const waterH = Math.max(floodVisual.waterHeightM, 0.02);
      const waterGeo = new THREE.BoxGeometry(waterW, waterH, waterL);
      const waterMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color(floodVisual.color),
        transparent: true,
        opacity: floodVisual.opacity,
        depthWrite: false,
      });
      const water = new THREE.Mesh(waterGeo, waterMat);
      water.position.set(0, waterH / 2, 0);
      scene.add(water);
      disposables.push(waterGeo);
      materials.push(waterMat);
    }

    let animId = 0;
    let cancelled = false;
    const amplitude = eqVisual?.enabled ? eqVisual.shakeAmplitude : 0;

    const tick = (t: number) => {
      if (cancelled) return;
      if (amplitude > 0) {
        group.position.x = Math.sin(t * 0.011) * amplitude;
        group.position.z = Math.cos(t * 0.014) * amplitude * 0.65;
        group.rotation.y = Math.sin(t * 0.008) * amplitude * 0.15;
      } else {
        group.position.x = 0;
        group.position.z = 0;
        group.rotation.y = 0;
      }
      renderer.render(scene, camera);
      animId = requestAnimationFrame(tick);
    };

    if (amplitude > 0) {
      animId = requestAnimationFrame(tick);
    } else {
      renderer.render(scene, camera);
    }

    return () => {
      cancelled = true;
      if (animId) cancelAnimationFrame(animId);
      mountNode.removeChild(renderer.domElement);
      disposables.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, [houseLayout, recommendations, floodVisual, eqVisual]);

  if (!houseLayout) return null;

  const lat = siteAnalysis?.coordinates?.lat ?? coordinates?.lat ?? -6.2088;
  const lng = siteAnalysis?.coordinates?.lng ?? coordinates?.lng ?? 106.8456;
  const cuacaEkstremScore = siteAnalysis?.riskEngine?.hazards?.cuaca_ekstrem?.score ?? null;
  const riskEngine = siteAnalysis?.riskEngine ?? null;
  const bmkgEventCount = siteAnalysis?.disasterHistory?.bmkgEarthquakes?.length ?? null;

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-5 w-full flex-1 flex flex-col">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <Box className="w-5 h-5 text-success" />
              Preview 3D
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Beta
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Massa bangunan sederhana · elevasi +{recommendations?.floorElevation ?? 0} cm · {houseLayout.floors ?? 1}{' '}
            lantai · atap {houseLayout.roofType ?? 'limas'}.
          </p>
        </div>

        <BetaFeatureNotice>
          Preview 3D masih beta — hanya gambaran bentuk blok bangunan, bukan render arsitektur. Detail ruang &
          material mengacu ke denah 2D dan perhitungan backend.
        </BetaFeatureNotice>

        <div className="flex-1 bg-map-chrome border border-map-border rounded-2xl relative overflow-hidden min-h-[360px] shadow-sm">
          <div ref={mountRef} className="absolute inset-0" />
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none flex flex-wrap gap-2">
            {floodVisual?.enabled ? (
              <p className="text-[10px] font-mono text-sky-200/80 bg-[#0A0D15]/80 border border-sky-500/20 rounded-lg px-2 py-1">
                Air twin {Math.round(floodVisual.waterHeightM * 100)} cm · {floodVisual.status}
              </p>
            ) : null}
            {eqVisual?.enabled ? (
              <p className="text-[10px] font-mono text-amber-200/80 bg-[#0A0D15]/80 border border-amber-500/20 rounded-lg px-2 py-1">
                Goyang {eqVisual.shakeAmplitude.toFixed(2)} · highlight {eqVisual.highlightIds.length}
              </p>
            ) : null}
          </div>
        </div>

        {riskEngine ? (
          <DigitalTwinPanel
            riskEngine={riskEngine}
            recommendations={recommendations}
            bmkgEventCount={bmkgEventCount}
            onFloodVisualChange={onFloodVisualChange}
            onEarthquakeVisualChange={onEarthquakeVisualChange}
          />
        ) : null}

        <div className="flex flex-wrap gap-2">
          {houseLayout.rooms.map((room, index) => (
            <span
              key={`${room.name}-${index}`}
              className="text-[12px] px-2.5 py-1 rounded-md border border-border bg-surface text-ink font-medium"
            >
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: getRoomColor(index) }}
              />
              {room.name}
            </span>
          ))}
        </div>

        <SunlightAnalysisPanel
          latitude={lat}
          longitude={lng}
          landOutline={houseLayout.landOutline}
        />

        <VentilationAnalysisPanel
          latitude={lat}
          longitude={lng}
          landOutline={houseLayout.landOutline}
          cuacaEkstremScore={cuacaEkstremScore}
        />

        <div className="flex justify-end pt-2 shrink-0">
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition"
          >
            Lanjut ke Kebutuhan Material
          </button>
        </div>
      </div>
    </div>
  );
}
