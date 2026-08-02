import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, LocateFixed, MapPin, RotateCcw, Search } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { DEFAULT_MAP_STYLE, isGoogleMapsUrl, resolveLocation, reverseGeocode } from '../../services/geocodeService';
import { confirm } from '../../lib/confirm';
import { toast } from 'sonner';

export function ChooseLocationStep() {
  const {
    coordinates,
    locationName,
    setLocationName,
    setCoordinates,
    confirmChooseLocation,
    siteAnalysis,
    recommendations,
    resetWorkspace,
    isResetting,
    isPending,
  } = usePondasiWorkspace();
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [pinFullAddress, setPinFullAddress] = useState<string | null>(null);
  const hasPriorAnalysis = Boolean(siteAnalysis || recommendations);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const reverseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReverseRef = useRef<(lat: number, lng: number) => void>(() => {});

  const resolveNameForPin = useCallback(
    async (lat: number, lng: number) => {
      setIsResolvingName(true);
      setError(null);
      try {
        const result = await reverseGeocode(lat, lng);
        setLocationName(result.name);
        setPinFullAddress(result.fullAddress || result.name);
      } catch (err) {
        setLocationName(`Lokasi ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setPinFullAddress(null);
        setError(err instanceof Error ? err.message : 'Gagal membaca alamat pin');
      } finally {
        setIsResolvingName(false);
      }
    },
    [setLocationName],
  );

  const scheduleReverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (reverseDebounceRef.current) {
        clearTimeout(reverseDebounceRef.current);
      }
      reverseDebounceRef.current = setTimeout(() => {
        void resolveNameForPin(lat, lng);
      }, 450);
    },
    [resolveNameForPin],
  );

  useEffect(() => {
    scheduleReverseRef.current = scheduleReverseGeocode;
  }, [scheduleReverseGeocode]);

  useEffect(() => {
    let cancelled = false;
    void reverseGeocode(coordinates.lat, coordinates.lng)
      .then((result) => {
        if (cancelled) return;
        setPinFullAddress(result.fullAddress || result.name);
        setLocationName(result.name);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: DEFAULT_MAP_STYLE,
      center: [coordinates.lng, coordinates.lat],
      zoom: 14,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const marker = new maplibregl.Marker({ color: '#3B82F6' })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);
    markerRef.current = marker;

    const resizeMap = () => {
      if (!mapRef.current) return;
      mapRef.current.resize();
    };

    map.on('load', resizeMap);

    map.on('click', (event) => {
      const { lat, lng } = event.lngLat;
      setCoordinates({ lat, lng });
      markerRef.current?.setLngLat([lng, lat]);
      scheduleReverseRef.current(lat, lng);
    });

    const resizeObserver = new ResizeObserver(() => {
      resizeMap();
    });
    resizeObserver.observe(container);

    // Flex layout may settle after first paint.
    requestAnimationFrame(resizeMap);

    return () => {
      if (reverseDebounceRef.current) {
        clearTimeout(reverseDebounceRef.current);
      }
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [setCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMapView = () => {
      markerRef.current?.setLngLat([coordinates.lng, coordinates.lat]);
      map.flyTo({ center: [coordinates.lng, coordinates.lat], zoom: 16, essential: true });
    };

    if (map.isStyleLoaded()) {
      syncMapView();
      return;
    }

    map.once('load', syncMapView);
  }, [coordinates]);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setSearch(trimmed);
      setIsSearching(true);
      setError(null);

      try {
        const result = await resolveLocation(trimmed);
        setLocationName(result.name);
        setPinFullAddress(result.fullAddress || result.name);
        setCoordinates({ lat: result.lat, lng: result.lng });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Pencarian lokasi gagal');
      } finally {
        setIsSearching(false);
      }
    },
    [setCoordinates, setLocationName],
  );

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    await runSearch(search);
  };

  const handlePopular = (label: string) => {
    void runSearch(label);
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi.');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        setIsLocating(false);
        void resolveNameForPin(lat, lng);
      },
      (geoError) => {
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Izin lokasi ditolak. Aktifkan akses lokasi di browser.'
            : 'Gagal mendapatkan lokasi Anda. Coba lagi.';
        setError(message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: 'Reset proyek',
      message:
        'Reset proyek? Semua hasil analisis, denah, material, polygon, dan input tanah akan dihapus. Pin lokasi di peta tetap di posisi sekarang.',
      confirmLabel: 'Reset proyek',
      tone: 'danger',
    });
    if (!confirmed) return;

    setError(null);
    try {
      await resetWorkspace();
      toast.success('Proyek direset');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal reset proyek';
      setError(message);
      toast.error(message);
    }
  };

  const handleConfirmLocation = async () => {
    setIsConfirming(true);
    setError(null);

    try {
      await confirmChooseLocation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan lokasi');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-5 pt-4 pb-3 space-y-3">
        <div className="max-w-3xl mx-auto text-center space-y-2">
          <div className="w-11 h-11 bg-accent-soft text-accent rounded-xl flex items-center justify-center mx-auto border border-blue-100">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-ink tracking-tight">Di mana Anda ingin membangun?</h2>
          <p className="text-ink-muted text-sm">
            Cari alamat, tempel link Google Maps, atau klik langsung di peta untuk menempatkan pin.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="mis. Ciseeng, Bogor atau paste link GMaps..."
            className="w-full bg-surface border border-border focus:border-accent focus:outline-none pl-12 pr-32 py-3.5 rounded-xl text-ink text-sm shadow-sm transition"
          />
          <button
            type="submit"
            disabled={!search.trim() || isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Cari
          </button>
        </form>

        {error ? <p className="text-xs text-danger max-w-xl mx-auto text-center">{error}</p> : null}
        {isGoogleMapsUrl(search) ? (
          <p className="text-[10px] text-success text-center">Link Google Maps terdeteksi</p>
        ) : null}

        <div className="text-xs text-ink-muted flex flex-wrap justify-center items-center gap-2">
          <span>Pencarian populer:</span>
          <button
            type="button"
            disabled={isSearching}
            onClick={() => handlePopular('Ubud, Bali')}
            className="text-accent hover:underline disabled:opacity-50"
          >
            Ubud, Bali
          </button>
          <span>&bull;</span>
          <button
            type="button"
            disabled={isSearching}
            onClick={() => handlePopular('Sentul, Bogor')}
            className="text-accent hover:underline disabled:opacity-50"
          >
            Sentul, Bogor
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => void handleConfirmLocation()}
            disabled={isConfirming || isSearching || isLocating || isResetting || isPending}
            className="px-5 py-2 rounded-lg text-xs font-bold border border-border bg-surface text-ink-secondary hover:border-accent hover:text-accent shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Lanjut dengan pin di peta
          </button>

          {hasPriorAnalysis ? (
            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={isResetting || isPending || isConfirming}
              className="px-5 py-2 rounded-lg text-xs font-bold border border-red-200 text-danger hover:bg-danger-soft transition disabled:opacity-50 flex items-center gap-2"
            >
              {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Reset & coba lokasi baru
            </button>
          ) : null}
        </div>
      </div>

      <div className="h-[min(520px,calc(100%-180px))] min-h-[360px] flex-1 shrink-0 mx-5 mb-5 rounded-2xl overflow-hidden border border-border relative shadow-sm">
        <div className="absolute inset-0 pondasi-map-host">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 z-10">
          <div
            className="bg-map-chrome/90 backdrop-blur px-3 py-2 rounded-lg text-[10px] text-slate-200 border border-map-border max-w-sm"
            title={pinFullAddress || locationName || ''}
          >
            {isResolvingName
              ? 'Membaca alamat pin…'
              : pinFullAddress || locationName || `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`}
          </div>
          <button
            type="button"
            onClick={handleMyLocation}
            disabled={isLocating || isSearching}
            title="Gunakan lokasi saya"
            className="bg-map-chrome/90 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-bold text-sky-300 border border-map-border hover:border-sky-400 hover:text-sky-200 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
            Lokasi saya
          </button>
        </div>
      </div>
    </div>
  );
}
