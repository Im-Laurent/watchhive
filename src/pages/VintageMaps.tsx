import { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import PageHead from '../components/PageHead';
import { usePlaces } from '../hooks/usePlaces';
import type { Region, WatchPlace } from '../data/types';

const REGIONS: { key: Region; label: string; center: [number, number]; zoom: number }[] = [
  { key: 'korea', label: '한국', center: [37.5709, 126.991], zoom: 12 },
  { key: 'shanghai', label: '상하이', center: [31.2304, 121.4737], zoom: 12 },
  { key: 'japan', label: '일본', center: [35.6762, 139.6503], zoom: 11 },
  { key: 'hongkong', label: '홍콩', center: [22.3193, 114.1694], zoom: 12 },
];

const EMBED_KEY = import.meta.env.VITE_GMAPS_EMBED_KEY as string | undefined;

// 지역별 지도 타일: 한국은 한국어 라벨(OSM 표준), 그 외는 영어/라틴 라벨(CARTO Voyager).
type TileConf = { url: string; attribution: string; subdomains: string; maxZoom: number };
const TILE_KO: TileConf = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap contributors',
  subdomains: 'abc',
  maxZoom: 19,
};
const TILE_EN: TileConf = {
  url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 20,
};
const tileFor = (region: Region): TileConf => (region === 'korea' ? TILE_KO : TILE_EN);

// 커스텀 플래그(핀) 마커 — Leaflet 기본 아이콘 이미지 대신 인라인 SVG divIcon 사용.
const flagIcon = L.divIcon({
  className: 'wh-flag',
  html: `
    <svg width="30" height="38" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">
      <path d="M6 2 v34" stroke="#1f2937" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M6.5 3 H24 l-4 5 4 5 H6.5 Z" fill="#b91c1c" stroke="#7f1d1d" stroke-width="1"/>
    </svg>`,
  iconSize: [30, 38],
  iconAnchor: [6, 36],
  popupAnchor: [6, -32],
});

function embedSrc(place: WatchPlace): string | null {
  if (!EMBED_KEY) return null;
  const q = place.placeId ? `place_id:${place.placeId}` : `${place.name}, ${place.address}`;
  // 한국은 한국어 카드, 그 외 국가는 영어 카드(지역명·도로명까지 영어).
  const lang = place.region === 'korea' ? 'ko' : 'en';
  const regionParam = place.region === 'korea' ? '&region=KR' : '';
  return `https://www.google.com/maps/embed/v1/place?key=${EMBED_KEY}&q=${encodeURIComponent(q)}&language=${lang}${regionParam}`;
}

export default function VintageMaps() {
  const { places } = usePlaces();
  const [region, setRegion] = useState<Region>('korea');
  const [selected, setSelected] = useState<WatchPlace | null>(null);

  const mapElRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const selectRef = useRef<(p: WatchPlace) => void>(() => {});
  selectRef.current = setSelected;

  const regionPlaces = useMemo(
    () =>
      places.filter(
        (p) => p.region === region && typeof p.lat === 'number' && typeof p.lng === 'number'
      ),
    [places, region]
  );

  // 지도 1회 초기화
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, { scrollWheelZoom: true });
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      tileRef.current = null;
    };
  }, []);

  // 지역에 맞는 타일로 교체 (한국=한국어 라벨, 그 외=영어 라벨)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) tileRef.current.remove();
    const t = tileFor(region);
    tileRef.current = L.tileLayer(t.url, {
      attribution: t.attribution,
      subdomains: t.subdomains,
      maxZoom: t.maxZoom,
    }).addTo(map);
  }, [region]);

  // 지역/데이터 변경 시 마커 갱신 + 지도 이동
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const pts: [number, number][] = [];
    for (const p of regionPlaces) {
      const marker = L.marker([p.lat, p.lng], { icon: flagIcon, title: p.name });
      marker.on('click', () => selectRef.current(p));
      marker.addTo(layer);
      pts.push([p.lat, p.lng]);
    }

    if (pts.length) {
      map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 15 });
    } else {
      const meta = REGIONS.find((r) => r.key === region)!;
      map.setView(meta.center, meta.zoom);
    }
    setSelected(null);
    // 레이아웃 확정 후 타일 재계산
    setTimeout(() => map.invalidateSize(), 0);
  }, [regionPlaces, region]);

  const src = selected ? embedSrc(selected) : null;

  return (
    <>
      <PageHead
        title="Vintage Maps"
        description="한국·상하이·일본·홍콩의 빈티지 시계점을 지도에서 찾아보세요. 플래그를 누르면 구글 장소 정보가 열립니다."
        path="/vintage-maps"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center mt-4 md:mt-8">Vintage Maps</h1>
        <p className="text-gray-600 text-center mb-8">
          제가 직접 다녀본 빈티지 시계점만 모았습니다. 플래그를 눌러 구글 장소 정보를 확인하세요.
        </p>

        {/* 지역 필터 */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              onClick={() => setRegion(r.key)}
              className={`px-5 py-2 rounded-full border-2 font-medium transition ${
                region === r.key
                  ? 'border-gray-800 bg-gray-800 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-gray-500'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 지도 */}
          <div className="lg:col-span-2">
            <div
              ref={mapElRef}
              className="w-full rounded-2xl shadow-md overflow-hidden"
              style={{ height: '70vh', minHeight: 380, zIndex: 0 }}
            />
            {regionPlaces.length === 0 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                이 지역에 등록된 시계점이 아직 없습니다.
              </p>
            )}
          </div>

          {/* 정보 패널 */}
          <aside className="lg:col-span-1">
            {selected ? (
              <div className="bg-white rounded-2xl shadow-md p-5">
                <h2 className="text-xl font-bold text-gray-800 mb-1">{selected.name}</h2>
                <p className="text-sm text-gray-500 mb-3">{selected.address}</p>
                {selected.note && <p className="text-sm text-gray-700 mb-3">{selected.note}</p>}

                {src ? (
                  <div className="rounded-xl overflow-hidden mb-3 border border-gray-200">
                    <iframe
                      title={selected.name}
                      src={src}
                      width="100%"
                      height="260"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">
                    구글 장소 카드를 보려면 VITE_GMAPS_EMBED_KEY 설정이 필요합니다.
                  </p>
                )}

                <a
                  href={selected.googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-sm font-medium text-blue-600 hover:underline"
                >
                  구글 지도에서 보기 →
                </a>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-md p-5 text-gray-500">
                <p className="mb-3 font-medium text-gray-700">
                  {REGIONS.find((r) => r.key === region)!.label} · 시계점 {regionPlaces.length}곳
                </p>
                <ul className="space-y-2">
                  {regionPlaces.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => {
                          setSelected(p);
                          mapRef.current?.setView([p.lat, p.lng], 16);
                        }}
                        className="text-left text-sm text-gray-700 hover:text-gray-900 hover:underline"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
                </ul>
                {regionPlaces.length > 0 && (
                  <p className="text-xs text-gray-400 mt-4">플래그 또는 목록을 눌러 상세 정보를 보세요.</p>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
