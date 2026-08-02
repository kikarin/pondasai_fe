import iconUrl from '@/assets/icon.png';

export const APP_NAME = 'pondasai';
export const APP_SUBTITLE = 'Pra-Konstruksi';
export const APP_TAGLINE = 'Analisis risiko banjir & gempa sebelum bangun rumah';
export const APP_ICON_URL = iconUrl;

export const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://pondasai.id';

export const DEFAULT_SEO = {
  title: `${APP_NAME} — Analisis Risiko Lahan sebelum Bangun Rumah`,
  description:
    'Cek risiko banjir, gempa, dan multi-hazard di lahan Anda, lalu lanjut konsep rumah, denah, material, dan PDF — berbasis InaRISK BNPB & rule engine deterministik.',
  keywords: [
    'pondasai',
    'analisis banjir',
    'analisis gempa',
    'rekomendasi pondasi',
    'perencanaan rumah',
    'InaRISK',
    'BNPB',
    'denah rumah',
    'risiko bencana',
    'pra konstruksi',
    'cek risiko lahan',
  ].join(', '),
  locale: 'id_ID',
} as const;
