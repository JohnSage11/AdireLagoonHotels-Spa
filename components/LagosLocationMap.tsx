'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  InfoWindow,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Navigation,
  Car,
  Plane,
  Compass,
  ExternalLink,
  Ship,
  LocateFixed,
  Layers,
} from 'lucide-react';
import { ADIRE_HOTEL_COORDINATES, formatNaira } from '@/lib/hotel-data';

interface LagosOriginPoint {
  id: string;
  name: string;
  area: string;
  lat: number;
  lng: number;
  roadFactor: number;
  offPeakSpeedKmh: number;
  peakSpeedKmh: number;
  boatMinutes?: number;
  routeVia: string;
}

const CURATED_ORIGINS: LagosOriginPoint[] = [
  {
    id: 'los-airport',
    name: 'Murtala Muhammed Int’l Airport (LOS)',
    area: 'Ikeja / International Terminal',
    lat: 6.5774,
    lng: 3.3212,
    roadFactor: 1.38,
    offPeakSpeedKmh: 45,
    peakSpeedKmh: 22,
    routeVia:
      'Airport Road → Oshodi–Oworonshoki Expy → Third Mainland Bridge → Ahmadu Bello Way, Victoria Island',
  },
  {
    id: 'eko-atlantic',
    name: 'Eko Atlantic & Bar Beach Promenade',
    area: 'Victoria Island South Waterfront',
    lat: 6.4148,
    lng: 3.4125,
    roadFactor: 1.18,
    offPeakSpeedKmh: 35,
    peakSpeedKmh: 20,
    routeVia: 'Eko Atlantic Boulevard → Ahmadu Bello Way → Adetokunbo Ademola Street',
  },
  {
    id: 'ikoyi-falomo',
    name: 'Ikoyi & Five Cowries Ferry Terminal',
    area: 'Falomo Bridge / Awolowo Road',
    lat: 6.4438,
    lng: 3.4258,
    roadFactor: 1.22,
    offPeakSpeedKmh: 36,
    peakSpeedKmh: 19,
    boatMinutes: 6,
    routeVia: 'Falomo Bridge → Akin Adesola Street → Adetokunbo Ademola Street, Victoria Island',
  },
  {
    id: 'lekki-phase-1',
    name: 'Lekki Phase 1 & Admiralty Way',
    area: 'Lekki–Ikoyi Link Bridge Corridor',
    lat: 6.4474,
    lng: 3.4723,
    roadFactor: 1.26,
    offPeakSpeedKmh: 38,
    peakSpeedKmh: 18,
    boatMinutes: 12,
    routeVia: 'Lekki–Ikoyi Link Bridge or Ozumba Mbadiwe Avenue → Adetokunbo Ademola Street',
  },
  {
    id: 'marina-cbd',
    name: 'Marina & Lagos Island Financial CBD',
    area: 'CMS / Broad Street / Onikan',
    lat: 6.4511,
    lng: 3.3896,
    roadFactor: 1.28,
    offPeakSpeedKmh: 38,
    peakSpeedKmh: 19,
    boatMinutes: 10,
    routeVia: 'Bonny Camp / Ahmadu Bello Way → Adetokunbo Ademola Street, Victoria Island',
  },
  {
    id: 'landmark-oniru',
    name: 'Oniru Beach & Water Corporation Drive',
    area: 'Victoria Island East / Oniru Estate',
    lat: 6.4218,
    lng: 3.4426,
    roadFactor: 1.18,
    offPeakSpeedKmh: 34,
    peakSpeedKmh: 19,
    routeVia: 'Water Corporation Drive → Ligali Ayorinde → Adetokunbo Ademola Street',
  },
  {
    id: 'yaba-tech',
    name: 'Yaba Tech & Mainland Business District',
    area: 'Herbert Macaulay / Mainland Central',
    lat: 6.5095,
    lng: 3.3711,
    roadFactor: 1.34,
    offPeakSpeedKmh: 44,
    peakSpeedKmh: 21,
    routeVia: 'Third Mainland Bridge → Osborne / Ring Road → Ahmadu Bello Way, Victoria Island',
  },
  {
    id: 'ikeja-gra',
    name: 'Ikeja GRA & Alausa Secretariat',
    area: 'Lagos Capital District',
    lat: 6.5889,
    lng: 3.3547,
    roadFactor: 1.36,
    offPeakSpeedKmh: 46,
    peakSpeedKmh: 22,
    routeVia: 'Ikorodu Road / Third Mainland Bridge → Victoria Island Central',
  },
];

function computeHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Install global Tier-1 Quota & Auth failure listener for Demo Key protection
let quotaHooksRegistered = false;
function ensureGoogleMapsQuotaHooks() {
  if (typeof window === 'undefined' || quotaHooksRegistered) return;
  quotaHooksRegistered = true;

  (window as unknown as Record<string, unknown>).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
    if (msg.includes('ApiProjectMapError') || msg.includes('InvalidKeyMapError')) {
      window.dispatchEvent(new CustomEvent('gmp-map-fallback'));
    }
  };
}

interface RouteAndCameraControllerProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  recenterSignal: number;
  onSelectOrigin: (id: string) => void;
  onOpenHotelInfo: () => void;
  selectedOriginId: string;
  liveGpsOrigin: { lat: number; lng: number; label: string } | null;
  onLiveRouteMetrics?: (metrics: { distanceKm: string; durationMins: number } | null) => void;
}

function RouteAndCameraController({
  origin,
  destination,
  recenterSignal,
  onSelectOrigin,
  onOpenHotelInfo,
  selectedOriginId,
  liveGpsOrigin,
  onLiveRouteMetrics,
}: RouteAndCameraControllerProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);

  // Recenter directly on the Victoria Island hotel pin when requested
  useEffect(() => {
    if (!map || recenterSignal === 0) return;
    map.panTo(destination);
    map.setZoom(15);
  }, [map, destination, recenterSignal]);

  // Render interactive vector circle beacons for Victoria Island Hotel & Lagos departure hubs (works without requiring a custom Cloud mapId)
  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    const created: google.maps.Circle[] = [];

    // Hotel gold halo & core beacon
    const hotelHalo = new google.maps.Circle({
      map,
      center: destination,
      radius: 420,
      fillColor: '#C8963E',
      fillOpacity: 0.25,
      strokeColor: '#C8963E',
      strokeOpacity: 0.9,
      strokeWeight: 2,
      clickable: true,
      zIndex: 50,
    });
    hotelHalo.addListener('click', () => onOpenHotelInfo());
    created.push(hotelHalo);

    // Curated Lagos hubs
    CURATED_ORIGINS.forEach((pt) => {
      const isSelected = selectedOriginId === pt.id;
      const hubCircle = new google.maps.Circle({
        map,
        center: { lat: pt.lat, lng: pt.lng },
        radius: isSelected ? 450 : 280,
        fillColor: isSelected ? '#0284c7' : '#334155',
        fillOpacity: isSelected ? 0.85 : 0.65,
        strokeColor: '#ffffff',
        strokeOpacity: 0.95,
        strokeWeight: isSelected ? 2.5 : 1.5,
        clickable: true,
        zIndex: isSelected ? 40 : 20,
      });
      hubCircle.addListener('click', () => onSelectOrigin(pt.id));
      created.push(hubCircle);
    });

    if (selectedOriginId === 'live-gps' && liveGpsOrigin) {
      const gpsCircle = new google.maps.Circle({
        map,
        center: { lat: liveGpsOrigin.lat, lng: liveGpsOrigin.lng },
        radius: 460,
        fillColor: '#0284c7',
        fillOpacity: 0.9,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: 2.5,
        clickable: false,
        zIndex: 45,
      });
      created.push(gpsCircle);
    }

    circlesRef.current = created;

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, destination, selectedOriginId, liveGpsOrigin, onSelectOrigin, onOpenHotelInfo]);

  // Draw route between active origin and Victoria Island hotel using modern Routes API SDK wrapper with geodesic fallback
  useEffect(() => {
    if (!map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    let isCancelled = false;

    const drawFallbackLineAndFit = () => {
      if (isCancelled || !map || typeof google === 'undefined') return;
      const line = new google.maps.Polyline({
        path: [origin, destination],
        geodesic: true,
        strokeColor: '#C8963E',
        strokeOpacity: 0.92,
        strokeWeight: 4,
        map,
      });
      polylinesRef.current = [line];

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, 56);
      onLiveRouteMetrics?.(null);
    };

    const routeClass = (
      routesLib as unknown as {
        Route?: {
          computeRoutes?: (req: Record<string, unknown>) => Promise<{
            routes?: Array<{
              distanceMeters?: number;
              durationMillis?: number;
              viewport?: google.maps.LatLngBounds;
              createPolylines?: () => google.maps.Polyline[];
            }>;
          }>;
        };
      }
    )?.Route;

    if (routeClass && typeof routeClass.computeRoutes === 'function') {
      routeClass
        .computeRoutes({
          origin,
          destination,
          travelMode: 'DRIVING',
          fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
        })
        .then((res) => {
          if (isCancelled) return;
          const primaryRoute = res?.routes?.[0];
          if (!primaryRoute) {
            drawFallbackLineAndFit();
            return;
          }

          if (typeof primaryRoute.createPolylines === 'function') {
            const newLines = primaryRoute.createPolylines();
            newLines.forEach((p) => {
              p.setOptions({
                strokeColor: '#C8963E',
                strokeOpacity: 0.95,
                strokeWeight: 5,
              });
              p.setMap(map);
            });
            polylinesRef.current = newLines;
          } else {
            drawFallbackLineAndFit();
          }

          if (primaryRoute.viewport) {
            map.fitBounds(primaryRoute.viewport, 52);
          } else {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(origin);
            bounds.extend(destination);
            map.fitBounds(bounds, 56);
          }

          if (primaryRoute.distanceMeters && primaryRoute.durationMillis) {
            onLiveRouteMetrics?.({
              distanceKm: (primaryRoute.distanceMeters / 1000).toFixed(1),
              durationMins: Math.max(3, Math.round(primaryRoute.durationMillis / 60000)),
            });
          } else {
            onLiveRouteMetrics?.(null);
          }
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (
            msg.includes('RESOURCE_EXHAUSTED') ||
            msg.includes('OVER_QUERY_LIMIT') ||
            msg.includes('429')
          ) {
            window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          }
          drawFallbackLineAndFit();
        });
    } else {
      drawFallbackLineAndFit();
    }

    return () => {
      isCancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [map, routesLib, origin, destination, onLiveRouteMetrics]);

  return null;
}

interface LagosLocationMapProps {
  onBookWithTransfer?: () => void;
}

export default function LagosLocationMap({ onBookWithTransfer }: LagosLocationMapProps) {
  const [selectedOriginId, setSelectedOriginId] = useState<string>('los-airport');
  const [liveGpsOrigin, setLiveGpsOrigin] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [hotelInfoOpen, setHotelInfoOpen] = useState<boolean>(true);
  const [recenterSignal, setRecenterSignal] = useState<number>(0);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);
  const [useInteractiveEmbedFallback, setUseInteractiveEmbedFallback] = useState<boolean>(false);
  const [runtimeApiKey, setRuntimeApiKey] = useState<string>(
    (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string) ||
      (process.env.GOOGLE_MAPS_API_KEY as string) ||
      ((globalThis as unknown as Record<string, string>).GOOGLE_MAPS_API_KEY ?? '')
  );
  const [keyChecked, setKeyChecked] = useState<boolean>(Boolean(runtimeApiKey));
  const [liveRouteMetrics, setLiveRouteMetrics] = useState<{
    distanceKm: string;
    durationMins: number;
  } | null>(null);

  useEffect(() => {
    ensureGoogleMapsQuotaHooks();
    const handleQuota = () => setQuotaExceeded(true);
    const handleFallback = () => setUseInteractiveEmbedFallback(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    window.addEventListener('gmp-map-fallback', handleFallback);

    if (!runtimeApiKey) {
      fetch('/api/maps-config')
        .then((res) => res.json())
        .then((data: { apiKey?: string }) => {
          if (data?.apiKey) {
            setRuntimeApiKey(data.apiKey);
          } else {
            setUseInteractiveEmbedFallback(true);
          }
          setKeyChecked(true);
        })
        .catch(() => {
          setUseInteractiveEmbedFallback(true);
          setKeyChecked(true);
        });
    }

    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuota);
      window.removeEventListener('gmp-map-fallback', handleFallback);
    };
  }, [runtimeApiKey]);

  const handleUseMyLiveLocation = () => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('Geolocation is not supported by your current browser.');
      return;
    }

    setIsLocating(true);
    setGpsStatus('Acquiring your live GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = Number(position.coords.latitude.toFixed(4));
        const userLng = Number(position.coords.longitude.toFixed(4));
        setLiveGpsOrigin({
          lat: userLat,
          lng: userLng,
          label: `Your Live GPS Location (${userLat.toFixed(3)}°N, ${userLng.toFixed(3)}°E)`,
        });
        setSelectedOriginId('live-gps');
        setGpsStatus(
          'Live GPS coordinates locked. Showing route and exact distance to Victoria Island, Lagos.'
        );
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setGpsStatus(
          'Location permission declined or unavailable in preview frame. Select any Lagos hub below to compare distance to Victoria Island.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const activeOrigin = useMemo(() => {
    if (selectedOriginId === 'live-gps' && liveGpsOrigin) {
      return {
        id: 'live-gps',
        name: liveGpsOrigin.label,
        area: 'Live Satellite / Browser Geolocation',
        lat: liveGpsOrigin.lat,
        lng: liveGpsOrigin.lng,
        roadFactor: 1.32,
        offPeakSpeedKmh: 40,
        peakSpeedKmh: 21,
        boatMinutes: undefined,
        routeVia:
          'Third Mainland Bridge / Ahmadu Bello Way → Plot 14, Adetokunbo Ademola Street, Victoria Island',
      };
    }
    return CURATED_ORIGINS.find((o) => o.id === selectedOriginId) || CURATED_ORIGINS[0];
  }, [selectedOriginId, liveGpsOrigin]);

  const distanceComparison = useMemo(() => {
    const straightKm = computeHaversineKm(
      activeOrigin.lat,
      activeOrigin.lng,
      ADIRE_HOTEL_COORDINATES.lat,
      ADIRE_HOTEL_COORDINATES.lng
    );
    const computedRoadKm = Math.max(0.8, straightKm * activeOrigin.roadFactor);
    const roadKmNum = liveRouteMetrics ? Number(liveRouteMetrics.distanceKm) : computedRoadKm;
    const roadMiles = roadKmNum * 0.621371;

    const isLongDistance = roadKmNum > 120;
    const offPeakMins = liveRouteMetrics
      ? liveRouteMetrics.durationMins
      : isLongDistance
      ? Math.round((roadKmNum / 75) * 60)
      : Math.max(4, Math.round((roadKmNum / activeOrigin.offPeakSpeedKmh) * 60));
    const peakMins = isLongDistance
      ? Math.round((roadKmNum / 55) * 60)
      : Math.max(
          offPeakMins + 6,
          Math.round((roadKmNum / activeOrigin.peakSpeedKmh) * 60)
        );

    return {
      straightKm: straightKm.toFixed(1),
      roadKm: roadKmNum.toFixed(1),
      roadMiles: roadMiles.toFixed(1),
      offPeakMins,
      peakMins,
      isLongDistance,
    };
  }, [activeOrigin, liveRouteMetrics]);

  const hotelPosition = useMemo(
    () => ({
      lat: ADIRE_HOTEL_COORDINATES.lat,
      lng: ADIRE_HOTEL_COORDINATES.lng,
    }),
    []
  );

  const originPosition = useMemo(
    () => ({
      lat: activeOrigin.lat,
      lng: activeOrigin.lng,
    }),
    [activeOrigin.lat, activeOrigin.lng]
  );

  const googleMapsInteractiveEmbedUrl = useMemo(() => {
    const mapMode = mapTypeId === 'hybrid' ? 'k' : 'm';
    const zoom = recenterSignal > 0 ? 16 : 14;
    return `https://maps.google.com/maps?q=${ADIRE_HOTEL_COORDINATES.lat},${ADIRE_HOTEL_COORDINATES.lng}+(The+Adire+Lagoon+Hotel+%26+Spa+Victoria+Island)&t=${mapMode}&z=${zoom}&ie=UTF8&iwloc=B&output=embed`;
  }, [mapTypeId, recenterSignal]);

  return (
    <div className="bg-[#0B2545] text-white rounded-3xl border border-white/15 shadow-2xl overflow-hidden">
      {/* Required Demo Key Quota Notification Banner if daily demo quota is reached */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-xs">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Editorial Banner */}
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D4A359] flex items-center gap-2">
            <Compass className="w-4 h-4 shrink-0" />
            <span>Victoria Island Waterfront Sanctuary · Live Google Map &amp; Distance Guide</span>
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
            Where to Find Us in Victoria Island &amp; Live Distance Comparator
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Located at <strong className="text-white">{ADIRE_HOTEL_COORDINATES.address}</strong> (
            <span className="font-mono text-[#D4A359]">6.4281° N, 3.4219° E</span>). Explore our live Victoria Island Google Map below and compare exact road distance, Five Cowries boat transfer time, and Lagos drive time from any city hub.
          </p>
        </div>

        {/* Live GPS Trigger + External Directions Link */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleUseMyLiveLocation}
            disabled={isLocating}
            className="px-4 py-2.5 min-h-[42px] text-xs font-semibold bg-[#C8963E] hover:bg-[#b5842f] text-white rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" />
            {isLocating ? 'Detecting GPS...' : 'Compare From My Live GPS'}
          </button>

          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${ADIRE_HOTEL_COORDINATES.lat},${ADIRE_HOTEL_COORDINATES.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2.5 min-h-[42px] text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-lg inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Open Victoria Island Turn-by-Turn Maps</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
        </div>
      </div>

      {gpsStatus && (
        <div className="bg-[#12325b] px-5 sm:px-8 py-2.5 border-b border-white/10 text-xs text-[#D4A359] flex items-center justify-between gap-2">
          <span>{gpsStatus}</span>
          {liveGpsOrigin && (
            <button
              type="button"
              onClick={() => setSelectedOriginId('live-gps')}
              className="underline font-semibold text-white cursor-pointer"
            >
              Active: {liveGpsOrigin.label}
            </button>
          )}
        </div>
      )}

      {/* Main Split Grid: Left Live Google Map Canvas (7 cols) | Right Distance & Route Comparator (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left 7 Cols: Live Interactive Google Maps Platform Canvas Centered on Victoria Island */}
        <div className="lg:col-span-7 relative bg-[#071930] border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between overflow-hidden min-h-[440px] sm:min-h-[520px]">
          {/* Top Floating Map Controls Overlay */}
          <div className="absolute top-3.5 left-3.5 right-3.5 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            <div className="bg-[#0B2545]/95 backdrop-blur-md border border-[#D4A359]/40 rounded-lg px-3 py-1.5 text-[11px] font-mono text-stone-100 shadow-lg pointer-events-auto">
              <span className="text-[#D4A359] font-bold">HOTEL PIN:</span> Plot 14 Adetokunbo Ademola St, Victoria Island · 6.4281°N, 3.4219°E
            </div>

            <div className="flex items-center gap-1.5 bg-[#0B2545]/95 backdrop-blur-md border border-white/20 rounded-lg p-1 shadow-lg pointer-events-auto">
              <button
                type="button"
                onClick={() => {
                  setRecenterSignal((s) => s + 1);
                  setHotelInfoOpen(true);
                }}
                className="px-2.5 py-1.5 hover:bg-white/10 rounded text-[11px] font-semibold text-[#D4A359] flex items-center gap-1 cursor-pointer"
                title="Focus Victoria Island Hotel Location"
              >
                <LocateFixed className="w-3.5 h-3.5" />
                <span>Focus V.I. Hotel</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
                }
                className="px-2.5 py-1.5 hover:bg-white/10 rounded text-[11px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                title="Toggle Roadmap / Satellite View"
              >
                <Layers className="w-3.5 h-3.5 text-[#D4A359]" />
                <span>{mapTypeId === 'roadmap' ? 'Satellite' : 'Map'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Google Maps Container (Explicit height required per CF2) */}
          <div className="relative w-full h-[440px] sm:h-[500px] flex-1">
            {keyChecked && runtimeApiKey && !useInteractiveEmbedFallback ? (
              <APIProvider apiKey={runtimeApiKey} libraries={['routes']}>
                <GoogleMap
                  defaultCenter={hotelPosition}
                  defaultZoom={13}
                  mapTypeId={mapTypeId}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  streetViewControl={true}
                  fullscreenControl={false}
                  mapTypeControl={false}
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full"
                >
                  <RouteAndCameraController
                    origin={originPosition}
                    destination={hotelPosition}
                    recenterSignal={recenterSignal}
                    onSelectOrigin={setSelectedOriginId}
                    onOpenHotelInfo={() => setHotelInfoOpen(true)}
                    selectedOriginId={selectedOriginId}
                    liveGpsOrigin={liveGpsOrigin}
                    onLiveRouteMetrics={setLiveRouteMetrics}
                  />

                  {hotelInfoOpen && (
                    <InfoWindow
                      position={hotelPosition}
                      maxWidth={260}
                      onCloseClick={() => setHotelInfoOpen(false)}
                    >
                      <div className="text-stone-900 p-1 space-y-1.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-[#C8963E] font-bold">
                          ★ 5-Star Lagoon Sanctuary
                        </p>
                        <h4 className="font-serif text-sm font-bold text-[#0B2545]">
                          The Adire Lagoon Hotel &amp; Spa
                        </h4>
                        <p className="text-xs text-stone-700 leading-snug">
                          {ADIRE_HOTEL_COORDINATES.address}
                        </p>
                        <p className="text-[11px] font-mono text-stone-500">
                          6.4281° N, 3.4219° E · 24/7 Power &amp; Security
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${ADIRE_HOTEL_COORDINATES.lat},${ADIRE_HOTEL_COORDINATES.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B2545] hover:text-[#C8963E] underline pt-0.5"
                        >
                          <span>View on Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            ) : (
              <iframe
                title="The Adire Lagoon Hotel & Spa — Plot 14, Adetokunbo Ademola Street, Victoria Island, Lagos"
                src={googleMapsInteractiveEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            )}
          </div>

          {/* Bottom Map Legend Bar */}
          <div className="bg-[#0B2545]/95 px-4 sm:px-6 py-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-300">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8963E] inline-block" />
                <span>The Adire Lagoon Hotel (Adetokunbo Ademola St, V.I.)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span>Selected Lagos Departure Hub ({activeOrigin.name})</span>
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D4A359]">
              Interactive Google Map · Victoria Island, Lagos
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Departure Selector + Distance & Travel-Time Telemetry */}
        <div className="lg:col-span-5 p-5 sm:p-7 flex flex-col justify-between space-y-6 bg-[#0B2545]">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#D4A359] mb-2">
                1. Choose Your Starting Point in Lagos (or Live GPS)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CURATED_ORIGINS.map((origin) => {
                  const isSelected = activeOrigin.id === origin.id;
                  return (
                    <button
                      key={origin.id}
                      type="button"
                      onClick={() => setSelectedOriginId(origin.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2 ${
                        isSelected
                          ? 'bg-white text-[#0B2545] border-[#C8963E] shadow-md'
                          : 'bg-white/5 text-stone-200 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <MapPin
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isSelected ? 'text-[#C8963E]' : 'text-stone-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{origin.name}</p>
                        <p
                          className={`text-[10px] truncate ${
                            isSelected ? 'text-stone-600' : 'text-stone-400'
                          }`}
                        >
                          {origin.area}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Distance & Travel Time Comparison Cards */}
            <div className="p-4 rounded-2xl bg-white/8 border border-white/15 space-y-4">
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#D4A359]">
                    Active Route Comparison to Victoria Island
                  </p>
                  <h3 className="font-serif text-lg font-bold text-white leading-snug">
                    {activeOrigin.name} → Victoria Island
                  </h3>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#C8963E]/20 text-[#D4A359] border border-[#C8963E]/40 shrink-0">
                  {distanceComparison.roadKm} km
                </span>
              </div>

              {/* 3 Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-stone-300 uppercase">Road Distance</p>
                  <p className="font-mono text-sm sm:text-base font-bold text-white tabular-nums mt-0.5">
                    {distanceComparison.roadKm} km
                  </p>
                  <p className="font-mono text-[10px] text-stone-400 tabular-nums">
                    ({distanceComparison.roadMiles} mi)
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-stone-300 uppercase">Off-Peak Drive</p>
                  <p className="font-mono text-sm sm:text-base font-bold text-emerald-400 tabular-nums mt-0.5">
                    ~{distanceComparison.offPeakMins} mins
                  </p>
                  <p className="text-[10px] text-stone-400">Clear corridor flow</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-[10px] text-stone-300 uppercase">Peak Traffic</p>
                  <p className="font-mono text-sm sm:text-base font-bold text-amber-300 tabular-nums mt-0.5">
                    ~{distanceComparison.peakMins} mins
                  </p>
                  <p className="text-[10px] text-stone-400">Rush hour estimate</p>
                </div>
              </div>

              <div className="text-xs text-stone-300 space-y-1.5 pt-1">
                <p className="flex items-start gap-2">
                  <Car className="w-4 h-4 text-[#D4A359] shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Recommended Route:</strong>{' '}
                    {activeOrigin.routeVia}
                  </span>
                </p>
                {activeOrigin.boatMinutes && (
                  <p className="flex items-start gap-2 text-sky-300">
                    <Ship className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      <strong>Five Cowries Lagoon Water Taxi:</strong> ~{activeOrigin.boatMinutes}{' '}
                      mins to Victoria Island jetty landing.
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chauffeur Transfer Callout */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] text-stone-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B2545]">
                <Plane className="w-3.5 h-3.5 text-[#C8963E]" />
                <span>Private Chauffeur SUV Transfer to Victoria Island ({formatNaira(45000)})</span>
              </div>
              <p className="text-xs text-stone-600">
                Complimentary with 4+ night Diaspora stays (Code: <strong className="font-mono">WELCOMEHOME</strong>).
              </p>
            </div>

            {onBookWithTransfer && (
              <button
                type="button"
                onClick={onBookWithTransfer}
                className="px-4 py-2.5 text-xs font-semibold bg-[#0B2545] hover:bg-[#163a66] text-white rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                Book Stay &amp; Transfer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
