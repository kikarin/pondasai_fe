import { FileText, Download } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { APP_NAME, APP_TAGLINE } from '../../config/brand';
import { fetchProjectReport } from '../../services/reportService';
import type {
  HazardEntry,
  HouseLayout,
  MaterialItem,
  SiteAnalysisData,
  StructuralRecommendation,
} from '../../types';
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

const COLORS = {
  nav: '#0d1a33',
  accent: '#2e5eea',
  ink: '#0d1a33',
  inkSecondary: '#2f3e5c',
  inkMuted: '#5b6b8c',
  border: '#e1e6ef',
  surfaceMuted: '#f7f9fc',
  white: '#ffffff',
  amberBg: '#fef1d1',
  amberBorder: '#f59e0b',
  redBg: '#fde2e2',
  redBorder: '#ef4444',
  greenBg: '#d7f3ea',
  greenBorder: '#0e8a6d',
  orangeBg: '#fde8d0',
  orangeBorder: '#e8622c',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
    backgroundColor: COLORS.white,
    color: COLORS.ink,
  },
  topBar: {
    height: 4,
    backgroundColor: COLORS.accent,
    marginBottom: 20,
    marginHorizontal: -40,
    marginTop: -36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.nav,
    letterSpacing: 0.3,
  },
  brandSub: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginTop: 3,
    maxWidth: 280,
    lineHeight: 1.4,
  },
  docMeta: { alignItems: 'flex-end' },
  docTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  docDate: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginTop: 3,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  cardMuted: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: COLORS.surfaceMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  label: { fontSize: 9, color: COLORS.inkMuted, width: '40%' },
  value: {
    fontSize: 9,
    color: COLORS.ink,
    fontWeight: 'bold',
    width: '58%',
    textAlign: 'right',
  },
  bodyText: {
    fontSize: 9,
    color: COLORS.inkSecondary,
    lineHeight: 1.45,
    marginTop: 6,
  },
  scoreRow: { flexDirection: 'row', marginBottom: 4 },
  scoreBox: {
    width: 110,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  scoreNumber: { fontSize: 26, fontWeight: 'bold', marginBottom: 2 },
  scoreCaption: {
    fontSize: 7,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreCategory: { fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  infoCol: { flex: 1, justifyContent: 'center' },
  hazardGrid: { flexDirection: 'row' },
  hazardCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: COLORS.white,
    marginRight: 10,
  },
  hazardCardLast: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  hazardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hazardName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.ink,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hazardScore: { fontSize: 20, fontWeight: 'bold', marginBottom: 2 },
  hazardScoreSub: { fontSize: 8, color: COLORS.inkMuted, marginBottom: 8 },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: 3 },
  hazardDesc: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginTop: 8,
    lineHeight: 1.4,
  },
  conceptGrid: { flexDirection: 'row', marginBottom: 8 },
  conceptItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COLORS.surfaceMuted,
    marginRight: 8,
  },
  conceptItemLast: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    backgroundColor: COLORS.surfaceMuted,
  },
  conceptLabel: {
    fontSize: 7,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  conceptValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.ink,
    lineHeight: 1.3,
  },
  floorPlanBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceMuted,
  },
  roomLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  roomLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  roomSwatch: {
    width: 8,
    height: 8,
    borderRadius: 2,
    marginRight: 4,
  },
  roomLegendText: { fontSize: 7, color: COLORS.inkMuted },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  matName: { width: '58%', fontSize: 9, color: COLORS.ink },
  matQty: { width: '22%', fontSize: 9, color: COLORS.ink, textAlign: 'right' },
  matUnit: { width: '20%', fontSize: 9, color: COLORS.inkMuted, textAlign: 'right' },
  matHeaderText: { fontSize: 8, fontWeight: 'bold', color: COLORS.inkMuted, textTransform: 'uppercase' },
  disclaimer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7.5,
    color: COLORS.inkMuted,
    lineHeight: 1.45,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: COLORS.inkMuted },
});

const HAZARD_KEYS = ['banjir', 'gempa'] as const;
const HAZARD_LABELS: Record<(typeof HAZARD_KEYS)[number], string> = {
  banjir: 'Banjir',
  gempa: 'Gempa',
};

function categoryTone(category: string | null | undefined) {
  const c = (category ?? '').toLowerCase();
  if (c.includes('tinggi') || c.includes('tidak')) {
    return { bg: COLORS.redBg, border: COLORS.redBorder, text: COLORS.redBorder, bar: COLORS.redBorder };
  }
  if (c.includes('sangat') || c.includes('hati')) {
    return { bg: COLORS.amberBg, border: COLORS.amberBorder, text: '#b45309', bar: COLORS.amberBorder };
  }
  if (c.includes('sedang')) {
    return { bg: COLORS.orangeBg, border: COLORS.orangeBorder, text: COLORS.orangeBorder, bar: COLORS.orangeBorder };
  }
  return { bg: COLORS.greenBg, border: COLORS.greenBorder, text: COLORS.greenBorder, bar: COLORS.greenBorder };
}

function scoreTone(score: number) {
  if (score >= 67) return categoryTone('Tinggi');
  if (score >= 34) return categoryTone('Sedang');
  return categoryTone('Rendah');
}

function formatDateId(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function resolveHazard(key: 'banjir' | 'gempa', siteAnalysis: SiteAnalysisData) {
  const engineHazard: HazardEntry | undefined = siteAnalysis.riskEngine?.hazards?.[key];
  const fallback = key === 'banjir' ? siteAnalysis.floodRisk : siteAnalysis.earthquakeRisk;

  if (engineHazard) {
    return {
      score: engineHazard.score,
      category: engineHazard.category,
      description: fallback.description,
      fetchStatus: engineHazard.fetchStatus,
    };
  }

  return {
    score: fallback.score ?? null,
    category: fallback.level,
    description: fallback.description,
    fetchStatus: 'SUCCESS' as const,
  };
}

function FloorPlanPdf({ layout }: { layout: HouseLayout }) {
  const scale = 12;
  const { width, length } = getLayoutDimensions(layout);

  return (
    <Svg
      width={width * scale + 20}
      height={length * scale + 20}
      viewBox={`0 0 ${width * scale + 20} ${length * scale + 20}`}
    >
      <Rect
        x={10}
        y={10}
        width={width * scale}
        height={length * scale}
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth={1}
      />
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

function ReportHeader({ title }: { title: string }) {
  return (
    <>
      <View style={styles.topBar} />
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.brandSub}>{APP_TAGLINE}</Text>
        </View>
        <View style={styles.docMeta}>
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.docDate}>{formatDateId()}</Text>
        </View>
      </View>
    </>
  );
}

function ReportFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{APP_NAME} — Laporan Pra-Konstruksi</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

type ReportData = {
  locationName: string;
  siteAnalysis: SiteAnalysisData | null;
  recommendations: StructuralRecommendation | null;
  materials: MaterialItem[] | null;
  houseLayout: HouseLayout | null;
  aiExplanation: string | null;
};

function ReportDocument({ data }: { data: ReportData }) {
  const { locationName, siteAnalysis, recommendations, materials, houseLayout, aiExplanation } = data;
  const engine = siteAnalysis?.riskEngine;
  const overall = siteAnalysis?.overallRiskScore ?? 0;
  const blocked = engine?.overall.blocked ?? false;
  const overallTone = scoreTone(overall);
  const suitability = siteAnalysis?.buildSuitability;
  const suitabilityTone = categoryTone(suitability?.label ?? suitability?.level);
  const coords = siteAnalysis?.coordinates;

  return (
    <Document>
      {/* Halaman 1 — Lokasi & struktur */}
      <Page size="A4" style={styles.page}>
        <ReportHeader title="Laporan Pra-Konstruksi" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Lokasi</Text>
          <View style={styles.scoreRow}>
            <View
              style={[
                styles.scoreBox,
                {
                  backgroundColor: blocked ? COLORS.surfaceMuted : overallTone.bg,
                  borderColor: blocked ? COLORS.border : overallTone.border,
                },
              ]}
            >
              <Text style={styles.scoreCaption}>Indeks Risiko</Text>
              <Text style={[styles.scoreNumber, { color: blocked ? COLORS.inkMuted : overallTone.text }]}>
                {blocked || !siteAnalysis ? 'N/A' : overall}
              </Text>
              <Text style={styles.scoreCaption}>{blocked ? 'Tidak dinilai' : '/ 100'}</Text>
              {!blocked && engine?.overall.category ? (
                <Text style={[styles.scoreCategory, { color: overallTone.text }]}>
                  {engine.overall.category}
                </Text>
              ) : null}
            </View>

            <View style={[styles.card, styles.infoCol]}>
              <View style={styles.row}>
                <Text style={styles.label}>Lokasi</Text>
                <Text style={styles.value}>{locationName || siteAnalysis?.locationName || '—'}</Text>
              </View>
              {coords ? (
                <View style={styles.row}>
                  <Text style={styles.label}>Koordinat</Text>
                  <Text style={styles.value}>
                    {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                  </Text>
                </View>
              ) : null}
              <View style={[styles.row, { marginBottom: 0 }]}>
                <Text style={styles.label}>Elevasi</Text>
                <Text style={styles.value}>
                  {siteAnalysis ? `${siteAnalysis.elevation.value} mdpl` : '—'}
                </Text>
              </View>
            </View>
          </View>

          {suitability ? (
            <View
              style={[
                styles.card,
                {
                  marginTop: 8,
                  backgroundColor: suitabilityTone.bg,
                  borderColor: suitabilityTone.border,
                  borderLeftWidth: 4,
                  borderLeftColor: suitabilityTone.border,
                },
              ]}
            >
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.ink, marginBottom: 4 }}>
                {suitability.label}
              </Text>
              <Text style={{ fontSize: 8, color: COLORS.inkSecondary, lineHeight: 1.45 }}>
                {suitability.advisory}
              </Text>
            </View>
          ) : null}
        </View>

        {siteAnalysis ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profil Hazard</Text>
            <View style={styles.hazardGrid}>
              {HAZARD_KEYS.map((key) => {
                const hazard = resolveHazard(key, siteAnalysis);
                const failed = hazard.fetchStatus !== 'SUCCESS';
                const score = Math.min(100, Math.max(0, hazard.score ?? 0));
                const tone = failed ? categoryTone('Sedang') : scoreTone(score);
                const category = failed ? 'Timeout' : (hazard.category ?? '—');

                return (
                  <View key={key} style={key === 'gempa' ? styles.hazardCardLast : styles.hazardCard}>
                    <View style={styles.hazardHeader}>
                      <Text style={styles.hazardName}>{HAZARD_LABELS[key]}</Text>
                      <Text
                        style={[
                          styles.badge,
                          {
                            backgroundColor: tone.bg,
                            color: tone.text,
                            borderWidth: 1,
                            borderColor: tone.border,
                          },
                        ]}
                      >
                        {category}
                      </Text>
                    </View>
                    <Text style={[styles.hazardScore, { color: failed ? COLORS.inkMuted : tone.text }]}>
                      {failed ? '—' : score}
                    </Text>
                    <Text style={styles.hazardScoreSub}>
                      {failed ? 'Data referensi tidak tersedia' : 'Indeks bahaya InaRISK'}
                    </Text>
                    {!failed ? (
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${score}%`, backgroundColor: tone.bar }]} />
                      </View>
                    ) : null}
                    {hazard.description ? (
                      <Text style={styles.hazardDesc}>{hazard.description}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Konsep & Rekomendasi Struktur</Text>
          <View style={styles.conceptGrid}>
            <View style={styles.conceptItem}>
              <Text style={styles.conceptLabel}>Sistem Struktur</Text>
              <Text style={styles.conceptValue}>{recommendations?.structureType || '—'}</Text>
            </View>
            <View style={styles.conceptItem}>
              <Text style={styles.conceptLabel}>Tipe Pondasi</Text>
              <Text style={styles.conceptValue}>{recommendations?.foundationType || '—'}</Text>
            </View>
            <View style={styles.conceptItemLast}>
              <Text style={styles.conceptLabel}>Elevasi Lantai</Text>
              <Text style={styles.conceptValue}>
                {recommendations ? `+${recommendations.floorElevation} m` : '—'}
              </Text>
            </View>
          </View>
          {recommendations?.description ? (
            <View style={styles.card}>
              <Text style={styles.bodyText}>{recommendations.description}</Text>
              {aiExplanation ? <Text style={styles.bodyText}>{aiExplanation}</Text> : null}
            </View>
          ) : null}
        </View>

        <ReportFooter />
      </Page>

      {/* Halaman 2 — Denah & material */}
      <Page size="A4" style={styles.page}>
        <ReportHeader title="Denah & Material" />

        {houseLayout ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Denah Ruang · {houseLayout.totalBuildingArea} m² · {houseLayout.floors ?? 1} lantai
            </Text>
            <View style={styles.floorPlanBox}>
              <FloorPlanPdf layout={houseLayout} />
              <View style={styles.roomLegend}>
                {houseLayout.rooms.map((room, index) => (
                  <View key={`${room.name}-${index}`} style={styles.roomLegendItem}>
                    <View style={[styles.roomSwatch, { backgroundColor: getRoomColor(index) }]} />
                    <Text style={styles.roomLegendText}>{room.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Denah Ruang</Text>
            <View style={styles.cardMuted}>
              <Text style={styles.bodyText}>Denah belum tersedia untuk proyek ini.</Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimasi Material Utama</Text>
          <View style={styles.card}>
            <View style={styles.tableHeader}>
              <Text style={[styles.matName, styles.matHeaderText]}>Material</Text>
              <Text style={[styles.matQty, styles.matHeaderText]}>Kuantitas</Text>
              <Text style={[styles.matUnit, styles.matHeaderText]}>Satuan</Text>
            </View>
            {(materials ?? []).length > 0 ? (
              (materials ?? []).map((mat, i) => (
                <View key={`${mat.name}-${i}`} style={styles.tableRow}>
                  <Text style={styles.matName}>{mat.name}</Text>
                  <Text style={styles.matQty}>{mat.quantity}</Text>
                  <Text style={styles.matUnit}>{mat.unit}</Text>
                </View>
              ))
            ) : (
              <View style={{ padding: 10 }}>
                <Text style={styles.bodyText}>Daftar material belum tersedia.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Dokumen ini adalah asesmen pra-konstruksi berbasis data publik (BNPB InaRISK, BMKG, spatial)
            dan rule engine deterministik. Bersifat indikatif — bukan pengganti soil test, survei
            geoteknik, IMB/PBG, atau gambar kerja arsitek/struktur. Hazard yang ditampilkan terbatas
            pada banjir dan gempa. Keputusan membangun tetap memerlukan verifikasi ahli bersertifikat.
          </Text>
        </View>

        <ReportFooter />
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
  const [reportFileName, setReportFileName] = useState(
    `Laporan_Pondasi_${locationName.replace(/\s+/g, '_')}.pdf`,
  );
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
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-8 space-y-8 shadow-sm">
        <div className="w-16 h-16 bg-danger-soft text-danger rounded-2xl flex items-center justify-center mx-auto border border-red-100">
          <FileText className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-ink tracking-tight">Laporan Lengkap Siap</h2>
          <p className="text-sm text-ink-muted">
            Laporan penuh Fase B: lokasi + rekomendasi desain + denah + material. Untuk PDF lokasi saja,
            unduh dari halaman Analisis Risiko.
          </p>
        </div>

        {reportReady ? (
          <PDFDownloadLink
            document={<ReportDocument data={reportData} />}
            fileName={reportFileName}
            className="w-full flex"
          >
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
            className="w-full py-4 bg-surface-muted text-ink-muted font-bold rounded-xl flex items-center justify-center gap-2"
          >
            Menyiapkan metadata laporan...
          </button>
        )}

        <p className="text-[10px] text-ink-muted italic mt-4">
          Metadata laporan disimpan di backend. Dokumen ini dapat dibagikan ke kontraktor atau arsitek.
        </p>
      </div>
    </div>
  );
}
