import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, LocateFixed, MapPin, RotateCcw, Search } from 'lucide-react';
import { usePondasiWorkspace } from '../../context/PondasiWorkspaceContext';
import { DEFAULT_MAP_STYLE, isGoogleMapsUrl, resolveLocation, reverseGeocode } from '../../services/geocodeService';

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
    const confirmed = window.confirm(
      'Reset proyek? Semua hasil analisis, denah, material, polygon, dan input tanah akan dihapus. Pin lokasi di peta tetap di posisi sekarang.',
    );
    if (!confirmed) return;

    setError(null);
    try {
      await resetWorkspace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal reset proyek');
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
      <div className="px-6 pt-5 pb-3 text-center space-y-3">
        <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mx-auto border border-blue-500/20">
          <MapPin className="w-6 h-6" />
        </div>
        <div className="max-w-2xl mx-auto space-y-1">
          <h2 className="text-2xl font-bold text-white tracking-tight">Di mana Anda ingin membangun?</h2>
          <p className="text-gray-400 text-sm">
            Cari alamat, tempel link Google Maps, atau klik langsung di peta untuk menempatkan pin.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="mis. Ciseeng, Bogor atau paste link GMaps..."
            className="w-full bg-[#141A2D] border-2 border-[#23324E] focus:border-blue-500 focus:outline-none pl-12 pr-32 py-4 rounded-xl text-white text-sm transition"
          />
          <button
            type="submit"
            disabled={!search.trim() || isSearching}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Cari
          </button>
        </form>

        {error ? <p className="text-xs text-red-400 max-w-xl mx-auto">{error}</p> : null}
        {isGoogleMapsUrl(search) ? (
          <p className="text-[10px] text-emerald-400 font-mono">Link Google Maps terdeteksi</p>
        ) : null}

        <div className="text-xs text-gray-500 flex flex-wrap justify-center items-center gap-2">
          <span>Pencarian populer:</span>
          <button
            type="button"
            disabled={isSearching}
            onClick={() => handlePopular('Ubud, Bali')}
            className="text-blue-400 hover:underline disabled:opacity-50"
          >
            Ubud, Bali
          </button>
          <span>&bull;</span>
          <button
            type="button"
            disabled={isSearching}
            onClick={() => handlePopular('Sentul, Bogor')}
            className="text-blue-400 hover:underline disabled:opacity-50"
          >
            Sentul, Bogor
          </button>
        </div>

        <button
          type="button"
          onClick={() => void handleConfirmLocation()}
          disabled={isConfirming || isSearching || isLocating || isResetting || isPending}
          className="px-5 py-2 rounded-lg text-xs font-bold border border-[#23324E] text-gray-200 hover:border-blue-500 hover:text-blue-300 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Lanjut dengan pin di peta
        </button>

        {hasPriorAnalysis ? (
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={isResetting || isPending || isConfirming}
            className="px-5 py-2 rounded-lg text-xs font-bold border border-red-500/30 text-red-300 hover:border-red-400 hover:text-red-200 transition disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Reset & coba lokasi baru
          </button>
        ) : null}
      </div>

      <div className="h-[520px] min-h-[360px] shrink-0 mx-6 mb-6 rounded-2xl overflow-hidden border border-[#1F293D] relative">
        <div className="absolute inset-0 pondasi-map-host">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-2 z-10">
          <div
            className="bg-black/75 backdrop-blur px-3 py-2 rounded-lg text-[10px] text-gray-300 font-mono border border-[#23324E] max-w-sm"
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
            className="bg-black/75 backdrop-blur px-3 py-2 rounded-lg text-[10px] font-bold text-blue-300 border border-[#23324E] hover:border-blue-500 hover:text-blue-200 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
            Lokasi saya
          </button>
        </div>
      </div>
    </div>
  );
}
