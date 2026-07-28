import { Download } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { LocationReportDocument } from './LocationReportDocument';
import type { SiteAnalysisData } from '../../types';

type Props = {
  locationName: string;
  siteAnalysis: SiteAnalysisData;
  className?: string;
};

export function LocationReportDownload({ locationName, siteAnalysis, className }: Props) {
  const fileName = `Laporan_Lokasi_${(locationName || siteAnalysis.locationName || 'Pondasi')
    .replace(/\s+/g, '_')
    .slice(0, 48)}.pdf`;

  return (
    <PDFDownloadLink
      document={<LocationReportDocument locationName={locationName} siteAnalysis={siteAnalysis} />}
      fileName={fileName}
      className={className ?? 'inline-flex'}
    >
      {({ loading }) => (
        <span
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-[#23324E] bg-[#141A2D] text-gray-200 hover:bg-[#1A2236] hover:text-white transition cursor-pointer"
        >
          <Download className="w-4 h-4 text-sky-400" />
          {loading ? 'Menyiapkan PDF…' : 'Unduh PDF laporan lokasi'}
        </span>
      )}
    </PDFDownloadLink>
  );
}
