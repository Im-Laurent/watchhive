import { useEffect, useState } from 'react';
import type { WatchPlace } from '../data/types';
import { PLACES_FALLBACK } from '../data/places.fallback';

type State = {
  places: WatchPlace[];
  source: 'live' | 'fallback' | 'loading';
  updatedAt: string | null;
};

/**
 * public/places.json(어드민 /admin 에서 큐레이션해 내보낸 파일)을 런타임에 읽는다.
 * 파일이 없거나·비었거나·요청 실패 시 PLACES_FALLBACK 으로 떨어진다.
 * useVideos 와 동일한 패턴.
 */
export function usePlaces(): State {
  const [state, setState] = useState<State>({
    places: PLACES_FALLBACK,
    source: 'loading',
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}places.json`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`places.json ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list: WatchPlace[] = Array.isArray(data?.places) ? data.places : [];
        const valid = list.filter((p) => typeof p.lat === 'number' && typeof p.lng === 'number');
        if (valid.length > 0) {
          setState({ places: valid, source: 'live', updatedAt: data.updatedAt ?? null });
        } else {
          setState({ places: PLACES_FALLBACK, source: 'fallback', updatedAt: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ places: PLACES_FALLBACK, source: 'fallback', updatedAt: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
