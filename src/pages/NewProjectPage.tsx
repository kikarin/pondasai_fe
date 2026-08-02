import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';
import { AppLogo } from '../components/layout/AppLogo';
import { ProjectSwitcher } from '../components/layout/ProjectSwitcher';
import { PageMeta } from '../components/seo/PageMeta';
import { AuthGate } from '../components/AuthGate';
import { useAuth } from '../context/AuthContext';
import { createProject } from '../services/projectService';
import { invalidateMyProjectsCache } from '../hooks/useMyProjects';
import {
  DEFAULT_CENTER,
  DEFAULT_MAP_STYLE,
  isGoogleMapsUrl,
  resolveLocation,
  reverseGeocode,
} from '../services/geocodeService';

export function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [coordinates, setCoordinates] = useState(DEFAULT_CENTER);
  const [locationName, setLocationName] = useState('');
  const [pinFullAddress, setPinFullAddress] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isResolvingName, setIsResolvingName] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const reverseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleReverseRef = useRef<(lat: number, lng: number) => void>(() => {});

  const resolveNameForPin = useCallback(async (lat: number, lng: number) => {
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
  }, []);

  const scheduleReverseGeocode = useCallback(
    (lat: number, lng: number) => {
      if (reverseDebounceRef.current) clearTimeout(reverseDebounceRef.current);
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
    if (!user) return;
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

    const resizeMap = () => mapRef.current?.resize();
    map.on('load', resizeMap);
    map.on('click', (event) => {
      const { lat, lng } = event.lngLat;
      setCoordinates({ lat, lng });
      markerRef.current?.setLngLat([lng, lat]);
      scheduleReverseRef.current(lat, lng);
    });

    const resizeObserver = new ResizeObserver(resizeMap);
    resizeObserver.observe(container);
    requestAnimationFrame(resizeMap);

    void resolveNameForPin(coordinates.lat, coordinates.lng);

    return () => {
      if (reverseDebounceRef.current) clearTimeout(reverseDebounceRef.current);
      resizeObserver.disconnect();
      marker.remove();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init map once when user ready
  }, [user]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => {
      markerRef.current?.setLngLat([coordinates.lng, coordinates.lat]);
      map.flyTo({ center: [coordinates.lng, coordinates.lat], zoom: 16, essential: true });
    };
    if (map.isStyleLoaded()) sync();
    else map.once('load', sync);
  }, [coordinates]);

  const runSearch = useCallback(async (query: string) => {
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
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    try {
      let resolvedName =
        locationName.trim() || `Lokasi ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
      try {
        const rev = await reverseGeocode(coordinates.lat, coordinates.lng);
        if (rev.name.trim()) resolvedName = rev.name.trim();
      } catch {
        /* keep resolvedName */
      }

      const project = await createProject({
        locationName: resolvedName,
        coordinates,
        currentStep: 'SITE_ANALYSIS',
      });
      invalidateMyProjectsCache();
      navigate(`/app/project/${project.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan proyek');
      setIsConfirming(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthGate nextPath="/app/new" />;
  }

  return (
    <div className="h-screen bg-canvas text-ink flex flex-col overflow-hidden">
      <PageMeta path="/app/new" noIndex />
      <header className="h-14 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between shrink-0 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <AppLogo to="/app" tone="light" size="sm" />
          <ProjectSwitcher />
        </div>
        <Link to="/app" className="text-sm text-ink-muted hover:text-ink shrink-0">
          Batal
        </Link>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-surface p-5 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <div className="w-10 h-10 bg-accent-soft text-accent rounded-xl flex items-center justify-center border border-blue-100">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="font-display text-xl font-semibold">Pilih lokasi lahan</h1>
            <p className="text-sm text-ink-muted">
              Proyek baru baru tersimpan setelah Anda mengunci pin. Cari alamat, tempel link Maps, atau klik peta.
            </p>
          </div>

          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void runSearch(search);
            }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari alamat atau paste link GMaps…"
              className="w-full bg-canvas border border-border focus:border-accent outline-none pl-10 pr-20 py-2.5 rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={!search.trim() || isSearching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cari'}
            </button>
          </form>

          {isGoogleMapsUrl(search) ? (
            <p className="text-[11px] text-success">Link Google Maps terdeteksi</p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (!navigator.geolocation) {
                setError('Browser tidak mendukung geolokasi.');
                return;
              }
              setIsLocating(true);
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const lat = pos.coords.latitude;
                  const lng = pos.coords.longitude;
                  setCoordinates({ lat, lng });
                  setIsLocating(false);
                  void resolveNameForPin(lat, lng);
                },
                () => {
                  setError('Gagal mendapatkan lokasi Anda.');
                  setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 15000 },
              );
            }}
            className="inline-flex items-center gap-2 text-sm text-accent font-medium"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
            Pakai lokasi saya
          </button>

          <div className="rounded-xl border border-border bg-canvas p-3 text-sm space-y-1">
            <p className="font-medium text-ink truncate">
              {isResolvingName ? 'Membaca alamat…' : locationName || 'Belum ada nama lokasi'}
            </p>
            {pinFullAddress ? <p className="text-xs text-ink-muted line-clamp-2">{pinFullAddress}</p> : null}
            <p className="font-mono text-[11px] text-ink-muted">
              {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
            </p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isConfirming || isResolvingName}
            className="w-full py-3 rounded-xl bg-accent hover:bg-[#2450d1] text-white text-sm font-semibold disabled:opacity-60"
          >
            {isConfirming ? 'Menyimpan proyek…' : 'Kunci pin & mulai analisis'}
          </button>
        </div>

        <div className="flex-1 min-h-[45vh] lg:min-h-0 relative">
          <div ref={mapContainer} className="absolute inset-0 pondasi-map-host" />
        </div>
      </div>
    </div>
  );
}
