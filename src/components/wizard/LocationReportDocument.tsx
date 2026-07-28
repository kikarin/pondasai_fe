import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { APP_NAME } from '../../config/brand';
import type { SiteAnalysisData } from '../../types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { fontSize: 22, marginBottom: 8, color: '#1e3a8a', fontWeight: 'bold' },
  subtitle: { fontSize: 10, color: '#64748b', marginBottom: 16 },
  section: { marginVertical: 8, padding: 10 },
  title: {
    fontSize: 14,
    marginBottom: 8,
    color: '#334155',
    fontWeight: 'bold',
    borderBottom: '1 solid #cbd5e1',
    paddingBottom: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 10, color: '#64748b' },
  value: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  bodyText: { fontSize: 9, color: '#334155', marginTop: 6, lineHeight: 1.45 },
  disclaimer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
  },
  disclaimerTitle: { fontSize: 9, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
});

type LocationReportProps = {
  locationName: string;
  siteAnalysis: SiteAnalysisData;
};

export function LocationReportDocument({ locationName, siteAnalysis }: LocationReportProps) {
  const engine = siteAnalysis.riskEngine;
  const suitability = siteAnalysis.buildSuitability;
  const coords = siteAnalysis.coordinates;
  const hazards = engine
    ? Object.values(engine.hazards).filter((h) => (h.score ?? 0) > 0 || h.fetchStatus !== 'SUCCESS')
    : [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{APP_NAME} — Laporan Lokasi</Text>
        <Text style={styles.subtitle}>
          Asesmen risiko lokasi (site analysis). Bukan laporan struktur, denah, atau material.
        </Text>

        <View style={styles.section}>
          <Text style={styles.title}>Lokasi</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama</Text>
            <Text style={styles.value}>{locationName || siteAnalysis.locationName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Koordinat</Text>
            <Text style={styles.value}>
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Elevasi</Text>
            <Text style={styles.value}>{siteAnalysis.elevation.value} mdpl</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Skor & Kelayakan</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Skor risiko keseluruhan</Text>
            <Text style={styles.value}>
              {engine?.overall.blocked ? 'Tidak dinilai' : `${siteAnalysis.overallRiskScore} / 100`}
            </Text>
          </View>
          {engine?.overall.category ? (
            <View style={styles.row}>
              <Text style={styles.label}>Kategori</Text>
              <Text style={styles.value}>{engine.overall.category}</Text>
            </View>
          ) : null}
          {suitability ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Kelayakan bangun</Text>
                <Text style={styles.value}>{suitability.label}</Text>
              </View>
              <Text style={styles.bodyText}>{suitability.advisory}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Hazard Ringkas</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Banjir</Text>
            <Text style={styles.value}>
              {siteAnalysis.floodRisk.level}
              {typeof siteAnalysis.floodRisk.score === 'number' ? ` · ${siteAnalysis.floodRisk.score}` : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gempa</Text>
            <Text style={styles.value}>
              {siteAnalysis.earthquakeRisk.level}
              {typeof siteAnalysis.earthquakeRisk.score === 'number'
                ? ` · ${siteAnalysis.earthquakeRisk.score}`
                : ''}
            </Text>
          </View>
          {hazards.slice(0, 6).map((h) => (
            <View key={h.key} style={styles.row}>
              <Text style={styles.label}>{h.key}</Text>
              <Text style={styles.value}>
                {h.fetchStatus !== 'SUCCESS' ? 'timeout' : `${h.category ?? '—'} · ${h.score ?? 0}`}
              </Text>
            </View>
          ))}
        </View>

        {engine?.recommendation && engine.recommendation.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.title}>Mitigasi Lokasi</Text>
            {engine.recommendation.slice(0, 5).map((item) => (
              <View key={`${item.priority}-${item.title}`} style={{ marginBottom: 6 }}>
                <Text style={styles.value}>{item.title}</Text>
                <Text style={styles.bodyText}>{item.description}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerTitle}>Disclaimer</Text>
          <Text style={styles.bodyText}>
            Dokumen ini hanya laporan lokasi / risiko berdasarkan data publik (BNPB InaRISK, BMKG,
            spatial). Bukan pengganti soil test, survei geoteknik, IMB/PBG, atau laporan desain
            struktur/denah/material. Untuk konsep rumah lengkap, lanjutkan jalur bangun di aplikasi.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
