// lib/map/tiles.ts
//
// Which basemap tiles the explore map uses.
//
// WHY THIS FILE EXISTS: the map used to hardcode CARTO's Positron tiles
// (basemaps.cartocdn.com). Those are free for NON-COMMERCIAL use only, capped
// at 75,000 monthly map views, with no SLA. Companio is commercial and expects
// 20k–50k visitors, so that was simultaneously a terms-of-service breach and an
// unsupported single point of failure on the busiest page.
//
// The provider is now chosen from the environment. Supplying a key is the only
// step needed to move to a paid, SLA-backed tier:
//
//   NEXT_PUBLIC_MAPTILER_KEY=...     → MapTiler (commercial tiers from free)
//   NEXT_PUBLIC_MAP_TILE_URL=...     → any raster {z}/{x}/{y} source you license
//   NEXT_PUBLIC_MAP_TILE_ATTRIBUTION → the attribution that source requires
//
// With nothing set we fall back to OpenStreetMap's own tile servers. Those are
// free and permit commercial use, but the OSMF Tile Usage Policy explicitly
// forbids heavy traffic. Fine for development and a soft launch; set a key
// before you push real volume at it.

export interface TileConfig {
  url: string;
  attribution: string;
  maxZoom: number;
  /** Subdomain list for {s}, or undefined when the URL has no {s} token. */
  subdomains?: string;
  /** True when we're on the rate-limited community fallback. */
  isCommunityFallback: boolean;
}

const OSM_FALLBACK: TileConfig = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19,
  isCommunityFallback: true,
};

export function getTileConfig(): TileConfig {
  const customUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL;
  if (customUrl) {
    return {
      url: customUrl,
      attribution:
        process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION ??
        '&copy; OpenStreetMap contributors',
      maxZoom: 19,
      isCommunityFallback: false,
    };
  }

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (maptilerKey) {
    return {
      // Positron is MapTiler's clean light style — the closest match to the
      // look the design was built against.
      url: `https://api.maptiler.com/maps/positron/{z}/{x}/{y}.png?key=${maptilerKey}`,
      attribution:
        '<a href="https://www.maptiler.com/copyright/">&copy; MapTiler</a> ' +
        '<a href="https://www.openstreetmap.org/copyright">&copy; OpenStreetMap</a> contributors',
      maxZoom: 20,
      isCommunityFallback: false,
    };
  }

  return OSM_FALLBACK;
}
