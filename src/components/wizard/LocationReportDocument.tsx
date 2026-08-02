import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { APP_NAME, APP_TAGLINE } from '../../config/brand';
import type { HazardEntry, SiteAnalysisData } from '../../types';

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
    paddingBottom: 40,
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
    marginBottom: 20,
    paddingBottom: 14,
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
  docMeta: {
    alignItems: 'flex-end',
  },
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
  section: {
    marginBottom: 14,
  },
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
  label: {
    fontSize: 9,
    color: COLORS.inkMuted,
    width: '38%',
  },
  value: {
    fontSize: 9,
    color: COLORS.ink,
    fontWeight: 'bold',
    width: '60%',
    textAlign: 'right',
  },
  valueLeft: {
    fontSize: 9,
    color: COLORS.inkSecondary,
    lineHeight: 1.45,
  },
  scoreRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  scoreBox: {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  scoreNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreCaption: {
    fontSize: 8,
    color: COLORS.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  scoreCategory: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },
  suitabilityBox: {
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    marginBottom: 4,
  },
  suitabilityLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.ink,
    marginBottom: 4,
  },
  suitabilityText: {
    fontSize: 9,
    color: COLORS.inkSecondary,
    lineHeight: 1.45,
  },
  reasons: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginTop: 6,
    lineHeight: 1.4,
  },
  hazardGrid: {
    flexDirection: 'row',
  },
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
    marginRight: 0,
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
    overflow: 'hidden',
  },
  hazardScore: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hazardScoreSub: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginBottom: 8,
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  hazardDesc: {
    fontSize: 8,
    color: COLORS.inkMuted,
    marginTop: 8,
    lineHeight: 1.4,
  },
  mitigationItem: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mitigationItemLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  mitigationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.ink,
    marginBottom: 3,
  },
  mitigationBody: {
    fontSize: 8,
    color: COLORS.inkSecondary,
    lineHeight: 1.45,
  },
  mitigationMeta: {
    fontSize: 7,
    color: COLORS.inkMuted,
    marginTop: 3,
  },
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
  footerText: {
    fontSize: 7,
    color: COLORS.inkMuted,
  },
});

type LocationReportProps = {
  locationName: string;
  siteAnalysis: SiteAnalysisData;
};

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

function resolveHazard(
  key: 'banjir' | 'gempa',
  siteAnalysis: SiteAnalysisData,
): { score: number | null; category: string | null; description: string; fetchStatus: string } {
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
    fetchStatus: 'SUCCESS',
  };
}

export function LocationReportDocument({ locationName, siteAnalysis }: LocationReportProps) {
  const engine = siteAnalysis.riskEngine;
  const suitability = siteAnalysis.buildSuitability;
  const coords = siteAnalysis.coordinates;
  const overall = siteAnalysis.overallRiskScore;
  const blocked = engine?.overall.blocked ?? false;
  const overallTone = scoreTone(overall);
  const suitabilityTone = categoryTone(suitability?.label ?? suitability?.level);
  const generatedAt = formatDateId();

  const mitigations =
    engine?.recommendation
      ?.filter((item) => item.sourceHazard === 'banjir' || item.sourceHazard === 'gempa')
      .slice(0, 5) ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>{APP_NAME}</Text>
            <Text style={styles.brandSub}>{APP_TAGLINE}</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docTitle}>Laporan Lokasi</Text>
            <Text style={styles.docDate}>{generatedAt}</Text>
          </View>
        </View>

        {/* Lokasi */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Lokasi</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.label}>Nama lokasi</Text>
              <Text style={styles.value}>{locationName || siteAnalysis.locationName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Koordinat</Text>
              <Text style={styles.value}>
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </Text>
            </View>
            <View style={[styles.row, { marginBottom: 0 }]}>
              <Text style={styles.label}>Elevasi</Text>
              <Text style={styles.value}>{siteAnalysis.elevation.value} mdpl</Text>
            </View>
          </View>
        </View>

        {/* Skor & kelayakan */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skor & Kelayakan</Text>
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
                {blocked ? 'N/A' : overall}
              </Text>
              <Text style={styles.scoreCaption}>{blocked ? 'Tidak dinilai' : '/ 100'}</Text>
              {!blocked && engine?.overall.category ? (
                <Text style={[styles.scoreCategory, { color: overallTone.text }]}>
                  {engine.overall.category}
                </Text>
              ) : null}
            </View>

            {suitability ? (
              <View
                style={[
                  styles.suitabilityBox,
                  {
                    flex: 1.4,
                    backgroundColor: suitabilityTone.bg,
                    borderColor: suitabilityTone.border,
                    borderLeftColor: suitabilityTone.border,
                    justifyContent: 'center',
                  },
                ]}
              >
                <Text style={styles.suitabilityLabel}>{suitability.label}</Text>
                <Text style={styles.suitabilityText}>{suitability.advisory}</Text>
                {suitability.reasons && suitability.reasons.length > 0 ? (
                  <Text style={styles.reasons}>{suitability.reasons.join(' · ')}</Text>
                ) : null}
              </View>
            ) : (
              <View style={[styles.cardMuted, { flex: 1.4, justifyContent: 'center' }]}>
                <Text style={styles.valueLeft}>Ringkasan kelayakan belum tersedia untuk lokasi ini.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Hazard — hanya banjir & gempa */}
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
                <View
                  key={key}
                  style={key === 'gempa' ? styles.hazardCardLast : styles.hazardCard}
                >
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

        {/* Mitigasi terkait banjir/gempa saja */}
        {mitigations.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mitigasi Lokasi</Text>
            <View style={styles.card}>
              {mitigations.map((item, index) => (
                <View
                  key={`${item.priority}-${item.title}`}
                  style={index === mitigations.length - 1 ? styles.mitigationItemLast : styles.mitigationItem}
                >
                  <Text style={styles.mitigationTitle}>
                    {item.priority}. {item.title}
                  </Text>
                  <Text style={styles.mitigationBody}>{item.description}</Text>
                  <Text style={styles.mitigationMeta}>
                    Sumber: {HAZARD_LABELS[item.sourceHazard as 'banjir' | 'gempa'] ?? item.sourceHazard}
                    {item.informational ? ' · Informasi' : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            Dokumen ini adalah asesmen pra-konstruksi berbasis data publik (BNPB InaRISK, BMKG, spatial)
            dan bersifat indikatif. Bukan pengganti penyelidikan tanah (soil test), survei geoteknik,
            atau perizinan resmi (IMB/PBG). Keputusan membangun tetap memerlukan verifikasi ahli
            bersertifikat. Laporan ini hanya mencakup risiko banjir dan gempa pada titik lokasi yang
            dipilih.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{APP_NAME} — Laporan Lokasi</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
