'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Companion } from '@/lib/data/companions';
import { getCity, CITIES } from '@/lib/data/cities';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  companions: Companion[];
  cityId: string;
  unlocked: boolean;
  /** Switch the active city (clicking another city's marker on the map). */
  onCityChange?: (id: string) => void;
  /** When the quiz is done, weight circles by match quality. */
  quizDone?: boolean;
  /** "Surprise me" / hover highlight — emphasised on the map in real time. */
  highlightId?: string | null;
}

/**
 * Privacy-first map. Real CARTO/OpenStreetMap basemap of the selected city, with
 * each companion shown as a FUZZY ~1.5 km circle at a deterministically-jittered
 * position — never an exact point. You can see roughly where people are (fun +
 * useful) without anyone's real location being exposed. Names are only shown for
 * unlocked profiles; you agree a public meeting spot at booking time.
 */

const FUZZ_RADIUS_M = 1500; // ~1.5 km privacy radius

/** Deterministic per-companion offset (±~3-4 km) around the city centre. */
function fuzzedLatLng(seed: string, lat: number, lng: number): [number, number] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  const a = (h % 1000) / 1000;
  const b = ((h >>> 10) % 1000) / 1000;
  return [lat + (a - 0.5) * 0.075, lng + (b - 0.5) * 0.085];
}

export function MapView({ companions, cityId, unlocked, onCityChange, quizDone, highlightId }: MapViewProps) {
  const city = getCity(cityId);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | undefined>(undefined);
  const layerRef = useRef<import('leaflet').LayerGroup | undefined>(undefined);
  const LRef = useRef<typeof import('leaflet') | undefined>(undefined);
  const [ready, setReady] = useState(false);

  const areaCounts = companions.reduce<Record<string, number>>((acc, c) => {
    acc[c.area] = (acc[c.area] ?? 0) + 1;
    return acc;
  }, {});
  const areas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]);

  // ── Init the map once per city ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const mod = await import('leaflet');
      // Leaflet ships CJS — normalise the dynamic-import shape.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const L = ((mod as any).default ?? mod) as typeof import('leaflet');
      if (cancelled || !containerRef.current) return;
      LRef.current = L;

      const map = L.map(containerRef.current, {
        center: [city.lat, city.lng],
        zoom: 11,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      // CARTO Positron — clean, light, premium basemap (retina via {r}).
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      setTimeout(() => map.invalidateSize(), 120);
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
      setReady(false);
      mapRef.current?.remove();
      mapRef.current = undefined;
      layerRef.current = undefined;
    };
  }, [city.lat, city.lng]);

  // ── Draw / redraw the fuzzy circles when the visible companions change ─────
  useEffect(() => {
    const L = LRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();

    // Other cities — a presence marker each, so zooming out to India shows the
    // whole network. Tapping one switches to that city.
    CITIES.forEach((ct) => {
      if (ct.id === cityId) return;
      const r = 6 + Math.min(ct.members / 250, 12);
      const m = L.circleMarker([ct.lat, ct.lng], {
        radius: r,
        color: '#7A4FE0',
        weight: 1.5,
        opacity: 0.5,
        fillColor: '#7A4FE0',
        fillOpacity: 0.25,
      }).addTo(layer);
      m.bindPopup(
        `<div style="font-family:system-ui,sans-serif">
           <div style="font-weight:700;font-size:14px;color:#141A2E">${ct.name}</div>
           <div style="font-size:12px;color:#5A6378">${ct.members}+ members · tap to explore</div>
         </div>`,
      );
      m.on('click', () => onCityChange?.(ct.id));
    });

    companions.forEach((c) => {
      const [lat, lng] = fuzzedLatLng(c.id + c.area, city.lat, city.lng);
      const named = unlocked || c.topMatch;
      const isHi = c.id === highlightId;
      // Match weight 0..1 (only when the quiz is done) — drives size + opacity so
      // stronger matches read bolder. Sorting by "Best match" makes them pop.
      const m = quizDone ? Math.max(0, Math.min(1, (c.matchScore - 65) / 30)) : 0.5;
      const color = isHi ? '#FFB23E' : c.availableNow ? '#1FAE6B' : '#2E6BFF';

      L.circle([lat, lng], {
        radius: FUZZ_RADIUS_M,
        color,
        weight: isHi ? 2.5 : 1.5,
        opacity: isHi ? 0.95 : 0.5,
        fillColor: color,
        fillOpacity: 0.08 + m * 0.16,
      }).addTo(layer);

      const dot = L.circleMarker([lat, lng], {
        radius: 4 + m * 5 + (isHi ? 2 : 0),
        color: '#fff',
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(layer);

      const title = named ? c.firstName : 'Someone nearby';
      const matchLine = named && quizDone
        ? `<div style="font-size:12px;color:#7A4FE0;font-weight:600;margin-bottom:2px">${c.matchScore}% match</div>`
        : '';
      const status = c.availableNow
        ? '<span style="color:#1FAE6B;font-weight:600">● Free now</span>'
        : `<span style="color:#5A6378">${c.availability}</span>`;
      const tail = named ? status : '<span style="color:#7A4FE0;font-weight:600">Unlock to see who</span>';
      dot.bindPopup(
        `<div style="font-family:system-ui,sans-serif;min-width:150px">
           <div style="font-weight:700;font-size:14px;color:#141A2E">${title}</div>
           ${matchLine}
           <div style="font-size:12px;color:#5A6378;margin:2px 0 4px">Around ${c.area} · within ~1.5 km</div>
           ${tail}
         </div>`,
        { closeButton: true },
      );
      if (isHi) dot.openPopup();
    });
  }, [ready, companions, unlocked, cityId, city.lat, city.lng, onCityChange, quizDone, highlightId]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          height: 'clamp(400px, 56vh, 580px)',
          border: '1.5px solid rgba(46,107,255,0.12)',
          boxShadow: 'var(--shadow-2)',
        }}
      >
        <div ref={containerRef} className="absolute inset-0" style={{ zIndex: 0 }} aria-label={`Map of ${city.name}`} />

        {/* City + count — top-right (clear of Leaflet's top-left zoom control) */}
        <div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-pill text-xs font-semibold pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.94)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(46,107,255,0.16)',
            color: 'var(--color-azure)',
            zIndex: 500,
          }}
        >
          {companions.length} companions across {city.name}
        </div>

        {/* Safety note — explains the fuzzy circles */}
        <div
          className="absolute bottom-4 left-4 right-4 sm:right-auto sm:max-w-md flex items-start gap-2 px-3.5 py-2.5 rounded-xl pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(31,174,107,0.22)',
            boxShadow: '0 6px 20px -8px rgba(20,26,46,0.22)',
            zIndex: 500,
          }}
        >
          <ShieldCheck size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--color-emerald)' }} aria-hidden="true" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-muted)' }}>
            Circles show an <strong>approximate ~1.5 km area</strong>, never an exact location. You&rsquo;ll
            agree a public meeting spot together when you book.
          </p>
        </div>
      </div>

      {/* Area availability — keyboard/SR operable list; pressing a chip pans the map to that area. */}
      {areas.length > 0 && (
        <div className="mt-4">
          <p
            id="areas-label"
            className="text-xs font-semibold mb-2 tracking-wide uppercase"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            Companions by area
          </p>
          <ul className="flex flex-wrap gap-2" role="list" aria-labelledby="areas-label">
            {areas.map(([area, count]) => {
              // Find a companion whose area matches to get a representative lat/lng.
              const rep = companions.find((c) => c.area === area);
              return (
                <li key={area}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!rep || !mapRef.current) return;
                      const [lat, lng] = fuzzedLatLng(rep.id + rep.area, city.lat, city.lng);
                      mapRef.current.flyTo([lat, lng], 13, { animate: true, duration: 0.8 });
                    }}
                    aria-label={`Pan map to ${area} — ${count} companion${count !== 1 ? 's' : ''}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors cursor-pointer hover:bg-azure/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-azure)]"
                    style={{
                      background: 'rgba(46,107,255,0.06)',
                      border: '1.5px solid rgba(46,107,255,0.16)',
                      color: 'var(--color-ink)',
                    }}
                  >
                    {area}
                    <span style={{ color: 'var(--color-azure)', fontWeight: 700 }}>{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
