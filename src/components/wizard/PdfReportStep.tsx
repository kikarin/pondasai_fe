import { FileText, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { APP_NAME } from '../../config/brand';
import { fetchProjectReport } from '../../services/reportService';
import type { HouseLayout } from '../../types';
import { getLayoutDimensions, getRoomColor } from '../../utils/floorPlan';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
  G,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { fontSize: 24, marginBottom: 20, color: '#1e3a8a', fontWeight: 'bold' },
  section: { margin: 10, padding: 10 },
  title: {
    fontSize: 16,
    marginBottom: 10,
    color: '#334155',
    fontWeight: 'bold',
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 5,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 10, color: '#64748b' },
  value: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  materialRow: { flexDirection: 'row', borderBottom: '1 solid #e2e8f0', paddingVertical: 5 },
  matName: { width: '60%', fontSize: 10 },
  matQty: { width: '20%', fontSize: 10, textAlign: 'right' },
  matUnit: { width: '20%', fontSize: 10, textAlign: 'right' },
  bodyText: { fontSize: 10, color: '#334155', marginTop: 10, lineHeight: 1.5 },
  floorPlanBox: {
    marginTop: 8,
    border: '1 solid #cbd5e1',
    padding: 8,
    alignItems: 'center',
  },
});

function FloorPlanPdf({ layout }: { layout: HouseLayout }) {
  const scale = 12;
  const { width, length } = getLayoutDimensions(layout);

  return (
    <Svg width={width * scale + 20} height={length * scale + 20} viewBox={`0 0 ${width * scale + 20} ${length * scale + 20}`}>
        <Rect x={10} y={10} width={width * scale} height={length * scale} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
      {layout.rooms.map((room, index) => {
        const color = getRoomColor(index);
        return (
          <G key={`${room.name}-${index}`}>
            <Rect
              x={10 + room.x * scale}
              y={10 + room.y * scale}
              width={room.width * scale}
              height={room.length * scale}
              fill={`${color}33`}
              stroke={color}
              strokeWidth={1}
            />
          </G>
        );
      })}
    </Svg>
  );
}

function ReportDocument({ data }: { data: any }) {
  const { locationName, siteAnalysis, recommendations, materials, houseLayout, aiExplanation } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{APP_NAME} - Laporan Pra-Konstruksi</Text>

        <View style={styles.section}>
          <Text style={styles.title}>Informasi Lokasi & Analisis Lahan</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Lokasi</Text>
            <Text style={styles.value}>{locationName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Skor Risiko (0-100)</Text>
            <Text style={styles.value}>{siteAnalysis?.overallRiskScore}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Risiko Banjir</Text>
            <Text style={styles.value}>{siteAnalysis?.floodRisk.level}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Risiko Gempa</Text>
            <Text style={styles.value}>{siteAnalysis?.earthquakeRisk.level}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Elevasi</Text>
            <Text style={styles.value}>{siteAnalysis?.elevation.value} mdpl</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Konsep & Rekomendasi Struktur</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Sistem Struktur</Text>
            <Text style={styles.value}>{recommendations?.structureType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tipe Pondasi</Text>
            <Text style={styles.value}>{recommendations?.foundationType}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Elevasi Lantai Dasar</Text>
            <Text style={styles.value}>+{recommendations?.floorElevation} cm</Text>
          </View>
          <Text style={styles.bodyText}>{recommendations?.description}</Text>
          {aiExplanation ? <Text style={styles.bodyText}>{aiExplanation}</Text> : null}
        </View>

        {houseLayout ? (
          <View style={styles.section}>
            <Text style={styles.title}>
              Denah Ruang ({houseLayout.totalBuildingArea} m² · {houseLayout.floors ?? 1} lantai)
            </Text>
            <View style={styles.floorPlanBox}>
              <FloorPlanPdf layout={houseLayout} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.title}>Estimasi Material Utama (Kuantitas Saja)</Text>
          <View style={[styles.materialRow, { backgroundColor: '#f1f5f9', padding: 5 }]}>
            <Text style={[styles.matName, { fontWeight: 'bold' }]}>Material</Text>
            <Text style={[styles.matQty, { fontWeight: 'bold' }]}>Kuantitas</Text>
            <Text style={[styles.matUnit, { fontWeight: 'bold' }]}>Satuan</Text>
          </View>
          {materials?.map((mat: any, i: number) => (
            <View key={i} style={styles.materialRow}>
              <Text style={styles.matName}>{mat.name}</Text>
              <Text style={styles.matQty}>{mat.quantity}</Text>
              <Text style={styles.matUnit}>{mat.unit}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

export function PdfReportStep() {
  const {
    projectId,
    locationName,
    siteAnalysis,
    recommendations,
    materials,
    houseLayout,
    aiExplanation,
  } = usePondasiWorkspace();
  const [reportFileName, setReportFileName] = useState(`Laporan_Pondasi_${locationName.replace(/\s+/g, '_')}.pdf`);
  const [reportReady, setReportReady] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    fetchProjectReport(projectId)
      .then((report) => {
        setReportFileName(report.metadata.fileName || report.payload.fileName);
        setReportReady(true);
      })
      .catch(() => {
        setReportReady(true);
      });
  }, [projectId]);

  const reportData = useMemo(
    () => ({
      locationName,
      siteAnalysis,
      recommendations,
      materials,
      houseLayout,
      aiExplanation,
    }),
    [locationName, siteAnalysis, recommendations, materials, houseLayout, aiExplanation],
  );

  return (
    <div className="flex-1 flex items-center justify-center p-8 text-center">
      <div className="max-w-md w-full bg-[#0F1423] border border-[#1F293D] rounded-2xl p-8 space-y-8 shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
          <FileText className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Laporan Anda Siap!</h2>
          <p className="text-sm text-gray-400">
            Laporan lengkap: analisis geospasial, denah ruang, rekomendasi struktur, dan kebutuhan material teknis.
          </p>
        </div>

        {reportReady ? (
          <PDFDownloadLink document={<ReportDocument data={reportData} />} fileName={reportFileName} className="w-full flex">
            {({ loading }) => (
              <button
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {loading ? 'Menyiapkan Dokumen...' : 'Unduh PDF Report'}
              </button>
            )}
          </PDFDownloadLink>
        ) : (
          <button
            disabled
            className="w-full py-4 bg-gray-700 text-gray-300 font-bold rounded-xl flex items-center justify-center gap-2"
          >
            Menyiapkan metadata laporan...
          </button>
        )}

        <p className="text-[10px] text-gray-500 italic mt-4">
          Metadata laporan disimpan di backend. Dokumen ini dapat dibagikan ke kontraktor atau arsitek.
        </p>
      </div>
    </div>
  );
}
