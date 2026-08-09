import { useEffect, useMemo, useRef, useState } from 'react';
import type { CandidatesPayload, PlaceCandidate, Region, WatchPlace } from '../data/types';

// ⚠️ 개발 전용 페이지. App.tsx 에서 import.meta.env.DEV 일 때만 라우트가 등록되며
// 프로덕션 빌드(dist)에는 포함되지 않는다. 일반 사용자에게 노출되지 않음.

const LS_KEY = 'wh-admin-overrides';

const REGION_OPTIONS: { value: Region | ''; label: string }[] = [
  { value: '', label: '(미지정)' },
  { value: 'korea', label: '한국' },
  { value: 'shanghai', label: '상하이' },
  { value: 'japan', label: '일본' },
  { value: 'hongkong', label: '홍콩' },
];
type Override = {
  selected?: boolean;
  name?: string;
  region?: Region | '';
  note?: string;
  lat?: number | null;
  lng?: number | null;
};

type Eff = {
  selected: boolean;
  name: string;
  region: Region | '';
  note: string;
  lat: number | null;
  lng: number | null;
};

function effective(c: PlaceCandidate, ov: Override = {}): Eff {
  return {
    selected: ov.selected ?? false,
    name: ov.name ?? c.name ?? '',
    region: ov.region ?? c.region ?? '',
    note: ov.note ?? '',
    lat: ov.lat !== undefined ? ov.lat : c.lat,
    lng: ov.lng !== undefined ? ov.lng : c.lng,
  };
}

export default function PlacesAdmin() {
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Override>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  // 필터
  const [watchOnly, setWatchOnly] = useState(true);
  const [regionFilter, setRegionFilter] = useState<Region | 'all'>('all');
  const [search, setSearch] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);

  const seededRef = useRef(Object.keys(overrides).length > 0);
  const fileRef = useRef<HTMLInputElement>(null);

  // 후보 + 기존 places.json 로드
  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}places.candidates.json`, { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`places.candidates.json ${r.status}`);
        return r.json();
      })
      .then((data: CandidatesPayload) => {
        setCandidates(Array.isArray(data?.candidates) ? data.candidates : []);
      })
      .catch((e) => setLoadError(String(e.message || e)));

    if (!seededRef.current) {
      fetch(`${base}places.json`, { cache: 'no-cache' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const places: WatchPlace[] = Array.isArray(data?.places) ? data.places : [];
          if (!places.length) return;
          setOverrides((prev) => {
            const next = { ...prev };
            for (const p of places) {
              next[p.id] = {
                selected: true,
                name: p.name,
                region: p.region,
                note: p.note ?? '',
                lat: p.lat,
                lng: p.lng,
              };
            }
            return next;
          });
        })
        .catch(() => {});
    }
  }, []);

  // 편집 상태 영속화
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const setOv = (id: string, patch: Override) =>
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates
      .map((c) => ({ c, e: effective(c, overrides[c.id]) }))
      .filter(({ c, e }) => {
        if (watchOnly && !c.isWatchGuess && !e.selected) return false;
        if (regionFilter !== 'all' && e.region !== regionFilter) return false;
        if (missingOnly && e.lat != null && e.lng != null) return false;
        if (q) {
          const hay = `${e.name} ${c.address ?? ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [candidates, overrides, watchOnly, regionFilter, search, missingOnly]);

  const selectedRows = useMemo(
    () => candidates.map((c) => ({ c, e: effective(c, overrides[c.id]) })).filter((r) => r.e.selected),
    [candidates, overrides]
  );

  const buildPlaces = (): { places: WatchPlace[]; warnings: string[] } => {
    const warnings: string[] = [];
    const places: WatchPlace[] = [];
    for (const { c, e } of selectedRows) {
      if (!e.name) warnings.push(`이름 없음: ${c.id}`);
      if (!e.region) warnings.push(`지역 미지정: ${e.name || c.id}`);
      if (e.lat == null || e.lng == null) {
        warnings.push(`좌표 없음(지도 제외됨): ${e.name || c.id}`);
        continue; // 좌표 없는 곳은 지도에 못 찍으므로 제외
      }
      places.push({
        id: c.id,
        name: e.name,
        address: c.address ?? '',
        lat: e.lat,
        lng: e.lng,
        region: (e.region || 'korea') as Region,
        placeId: c.placeId ?? null,
        note: e.note,
        googleUrl: c.googleUrl,
      });
    }
    return { places, warnings };
  };

  const exportJson = () => {
    const { places, warnings } = buildPlaces();
    if (warnings.length && !confirm(`주의:\n- ${warnings.join('\n- ')}\n\n계속 내보낼까요?`)) return;
    const payload = { updatedAt: new Date().toISOString(), count: places.length, places };
    const blob = new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'places.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const places: WatchPlace[] = Array.isArray(data?.places) ? data.places : [];
        setOverrides((prev) => {
          const next = { ...prev };
          for (const p of places) {
            next[p.id] = {
              selected: true,
              name: p.name,
              region: p.region,
              note: p.note ?? '',
              lat: p.lat,
              lng: p.lng,
            };
          }
          return next;
        });
      } catch (e) {
        alert('JSON 파싱 실패: ' + (e as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (!confirm('편집 중인 모든 선택/수정을 초기화할까요? (localStorage 삭제)')) return;
    localStorage.removeItem(LS_KEY);
    setOverrides({});
  };

  const numFmt = (n: number | null) => (n == null ? '' : String(n));

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8" style={{ fontFamily: "'Rajdhani','Noto Sans',sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-800">장소 어드민 · Vintage Maps</h1>
          <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
            개발 전용 (배포 미노출)
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          후보 {candidates.length}곳 · 선택 {selectedRows.length}곳 · 표시 {rows.length}곳
        </p>

        {loadError && (
          <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">
            후보 로드 실패: {loadError}
            <br />
            먼저 <code>node scripts/build-candidates.mjs "&lt;저장한 장소.json 경로&gt;"</code> 를 실행하세요.
          </div>
        )}

        {/* 필터 바 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={watchOnly} onChange={(e) => setWatchOnly(e.target.checked)} />
            시계 업종만
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} />
            좌표 없음만
          </label>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value as Region | 'all')}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">전체 지역</option>
            {REGION_OPTIONS.filter((o) => o.value).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름·주소 검색"
            className="text-sm border border-gray-300 rounded px-2 py-1 flex-1 min-w-[140px]"
          />
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => fileRef.current?.click()} className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
              가져오기
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
            />
            <button onClick={resetAll} className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
              초기화
            </button>
            <button onClick={exportJson} className="text-sm px-4 py-1 rounded bg-gray-800 text-white hover:bg-gray-700">
              Export places.json
            </button>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th className="p-2 w-10">노출</th>
                <th className="p-2">이름</th>
                <th className="p-2">주소</th>
                <th className="p-2 w-24">지역</th>
                <th className="p-2 w-40">좌표</th>
                <th className="p-2">메모</th>
                <th className="p-2 w-14"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, e }) => {
                const noCoords = e.lat == null || e.lng == null;
                return (
                  <tr key={c.id} className={`border-b border-gray-100 ${e.selected ? 'bg-green-50' : ''}`}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={e.selected}
                        onChange={(ev) => setOv(c.id, { selected: ev.target.checked })}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        value={e.name}
                        onChange={(ev) => setOv(c.id, { name: ev.target.value })}
                        className="w-full border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-1 py-0.5"
                        placeholder="(이름 없음)"
                      />
                      {!c.isWatchGuess && (
                        <span className="ml-1 text-[10px] px-1 rounded bg-gray-100 text-gray-400">시계?</span>
                      )}
                    </td>
                    <td className="p-2 text-gray-500 max-w-[220px] truncate" title={c.address ?? ''}>
                      {c.address}
                    </td>
                    <td className="p-2">
                      <select
                        value={e.region}
                        onChange={(ev) => setOv(c.id, { region: ev.target.value as Region | '' })}
                        className="border border-gray-200 rounded px-1 py-0.5 w-full"
                      >
                        {REGION_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      {noCoords ? (
                        <div className="flex gap-1">
                          <input
                            defaultValue={numFmt(e.lat)}
                            onBlur={(ev) =>
                              setOv(c.id, { lat: ev.target.value === '' ? null : Number(ev.target.value) })
                            }
                            placeholder="위도"
                            className="w-16 border border-red-200 rounded px-1 py-0.5"
                          />
                          <input
                            defaultValue={numFmt(e.lng)}
                            onBlur={(ev) =>
                              setOv(c.id, { lng: ev.target.value === '' ? null : Number(ev.target.value) })
                            }
                            placeholder="경도"
                            className="w-16 border border-red-200 rounded px-1 py-0.5"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          {e.lat!.toFixed(4)}, {e.lng!.toFixed(4)}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        value={e.note}
                        onChange={(ev) => setOv(c.id, { note: ev.target.value })}
                        className="w-full border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-1 py-0.5"
                        placeholder="메모"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <a href={c.googleUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                        지도
                      </a>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400">
                    조건에 맞는 후보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          편집 → <b>Export places.json</b> → 받은 파일을 <code>public/places.json</code> 로 교체 → 커밋 →{' '}
          <code>npm run deploy</code>. (선택된 전체 {selectedRows.length}곳이 내보내집니다.)
        </p>
      </div>
    </div>
  );
}
