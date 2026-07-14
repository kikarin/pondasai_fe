import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Box } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { BetaFeatureNotice } from './BetaFeatureNotice';
import { getLayoutDimensions, getRoomColor } from '../../utils/floorPlan';

export function ThreeDPreviewStep() {
  const { houseLayout, recommendations, nextStep } = usePondasiWorkspace();
  const mountRef = useRef<HTMLDivElement>(null);

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

    const roofType = houseLayout.roofType ?? 'limas';
    if (roofType === 'datar') {
      const roofGeo = new THREE.BoxGeometry(buildingWidth + 0.2, 0.2, buildingLength + 0.2);
      const roofMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, floorElevationM + 0.3 + wallHeight + 0.1, 0);
      group.add(roof);
      disposables.push(roofGeo);
      materials.push(roofMat);
    } else {
      const roofGeo = new THREE.ConeGeometry(Math.max(buildingWidth, buildingLength) * 0.65, 1.8, 4);
      const roofMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      const roof = new THREE.Mesh(roofGeo, roofMat);
      roof.position.set(0, floorElevationM + 0.3 + wallHeight + 0.9, 0);
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      disposables.push(roofGeo);
      materials.push(roofMat);
    }

    scene.add(group);
    renderer.render(scene, camera);

    return () => {
      mountNode.removeChild(renderer.domElement);
      disposables.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      renderer.dispose();
    };
  }, [houseLayout, recommendations]);

  if (!houseLayout) return null;

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-5 w-full flex-1 flex flex-col">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Box className="w-5 h-5 text-emerald-400" />
              Preview 3D
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Beta
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Massa bangunan sederhana · elevasi +{recommendations?.floorElevation ?? 0} cm · {houseLayout.floors ?? 1}{' '}
            lantai · atap {houseLayout.roofType ?? 'limas'}.
          </p>
        </div>

        <BetaFeatureNotice>
          Preview 3D masih beta — hanya gambaran bentuk blok bangunan, bukan render arsitektur. Detail ruang &
          material mengacu ke denah 2D dan perhitungan backend.
        </BetaFeatureNotice>

        <div className="flex-1 bg-[#0A0D15] border border-[#1F293D] rounded-2xl relative overflow-hidden min-h-[360px]">
          <div ref={mountRef} className="absolute inset-0" />
        </div>

        <div className="flex flex-wrap gap-2">
          {houseLayout.rooms.map((room, index) => (
            <span
              key={`${room.name}-${index}`}
              className="text-[10px] px-2 py-1 rounded-md border border-[#23324E] bg-[#141A2D] font-mono"
              style={{ color: getRoomColor(index) }}
            >
              {room.name}
            </span>
          ))}
        </div>

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
