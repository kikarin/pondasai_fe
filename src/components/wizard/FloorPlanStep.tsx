import { Layers } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { BetaFeatureNotice } from './BetaFeatureNotice';
import { getLayoutDimensions, getRoomColor } from '../../utils/floorPlan';

export function FloorPlanStep() {
  const { houseLayout, nextStep } = usePondasiWorkspace();

  if (!houseLayout) return null;

  const gridScale = 36;
  const { width: widthMeters, length: lengthMeters } = getLayoutDimensions(houseLayout);

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Denah Ruang 2D
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Beta
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Sketsa otomatis {houseLayout.rooms.length} ruang · {houseLayout.floors ?? 1} lantai · atap{' '}
              {houseLayout.roofType ?? 'limas'}.
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block">Luas Bangunan</span>
            <span className="text-2xl font-bold text-white font-mono">
              {houseLayout.totalBuildingArea} <span className="text-sm">m²</span>
            </span>
          </div>
        </div>

        <BetaFeatureNotice>
          Denah ini masih tahap beta — hanya ilustrasi pembagian ruang, bukan gambar arsitektur final. Bentuk
          bangunan disederhanakan menjadi persegi; polygon lahan Step 3 dipakai untuk perhitungan luas & material.
        </BetaFeatureNotice>

        <div className="bg-[#0A0D16] border border-[#1F293D] rounded-2xl p-6 flex flex-col items-center gap-4 overflow-x-auto">
          <svg
            width={widthMeters * gridScale + 4}
            height={lengthMeters * gridScale + 4}
            className="bg-black/20 border border-gray-700 rounded-lg"
          >
            <defs>
              <pattern id="floor-grid" width={gridScale} height={gridScale} patternUnits="userSpaceOnUse">
                <path d={`M ${gridScale} 0 L 0 0 0 ${gridScale}`} fill="none" stroke="#1F293D" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#floor-grid)" />

            {houseLayout.rooms.map((room, idx) => {
              const color = getRoomColor(idx);
              return (
                <g key={`${room.name}-${idx}`}>
                  <rect
                    x={room.x * gridScale + 2}
                    y={room.y * gridScale + 2}
                    width={room.width * gridScale}
                    height={room.length * gridScale}
                    fill={`${color}25`}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  <text
                    x={(room.x + room.width / 2) * gridScale + 2}
                    y={(room.y + room.length / 2) * gridScale + 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={color}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {room.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap justify-center gap-2">
            {houseLayout.rooms.map((room, idx) => (
              <span
                key={`${room.name}-${idx}`}
                className="text-[10px] px-2 py-1 rounded-md border border-[#23324E] bg-[#141A2D] font-mono"
                style={{ color: getRoomColor(idx) }}
              >
                {room.name} · {room.width}×{room.length} m
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={nextStep}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/30 transition"
          >
            Lanjut ke Preview 3D
          </button>
        </div>
      </div>
    </div>
  );
}
