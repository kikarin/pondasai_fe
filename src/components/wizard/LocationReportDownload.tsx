import { Download, FileDown } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { LocationReportDocument } from './LocationReportDocument';
import type { SiteAnalysisData } from '../../types';

type Props = {
  locationName: string;
  siteAnalysis: SiteAnalysisData;
  className?: string;
  variant?: 'dark' | 'light' | 'blue';
};

export function LocationReportDownload({
  locationName,
  siteAnalysis,
  className,
  variant = 'dark',
}: Props) {
  const fileName = `Laporan_Lokasi_${(locationName || siteAnalysis.locationName || 'Pondasi')
    .replace(/\s+/g, '_')
    .slice(0, 48)}.pdf`;

  const buttonClass =
    variant === 'light'
      ? 'inline-flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink transition cursor-pointer'
      : variant === 'blue'
        ? 'inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-bold border border-blue-600 bg-blue-600 text-white hover:bg-blue-500 hover:text-white transition shadow-sm shadow-blue-600/20 cursor-pointer'
        : 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#23324E] bg-[#141A2D] text-gray-200 hover:bg-[#1A2236] hover:text-white transition cursor-pointer';

  const Icon = variant === 'light' ? FileDown : Download;
  const iconClass =
    variant === 'blue' ? 'w-4 h-4 text-white' : variant === 'dark' ? 'w-4 h-4 text-sky-400' : 'w-3.5 h-3.5';

  return (
    <PDFDownloadLink
      document={<LocationReportDocument locationName={locationName} siteAnalysis={siteAnalysis} />}
      fileName={fileName}
      className={className ?? 'inline-flex'}
    >
      {({ loading }) => (
        <span className={buttonClass}>
          <Icon className={iconClass} />
          {loading
            ? 'Menyiapkan PDF…'
            : variant === 'light' || variant === 'blue'
              ? 'Unduh laporan lokasi'
              : 'Unduh PDF laporan lokasi'}
        </span>
      )}
    </PDFDownloadLink>
  );
}
