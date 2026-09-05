import { useEffect, useState } from 'react';
import type { MuseumPiece } from '../data/types';
import { FALLBACK_MUSEUM } from '../data/museum.fallback';

type State = {
  pieces: MuseumPiece[];
  source: 'live' | 'fallback' | 'loading';
  updatedAt: string | null;
};

/**
 * public/museum.json 을 런타임에 읽는다. 이 파일은 명화 프로젝트의
 * scripts/export_to_site.py 가 굽는다 — 명제표 문구의 출처는 거기 세 DB 뿐이다.
 *
 * 파일이 없거나·비었거나·요청이 실패하면 FALLBACK_MUSEUM 으로 떨어진다.
 * useVideos 와 같은 형태다.
 */
export function useMuseum(): State {
  const [state, setState] = useState<State>({
    pieces: FALLBACK_MUSEUM,
    source: 'loading',
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}museum.json`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`museum.json ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list: MuseumPiece[] = Array.isArray(data?.pieces) ? data.pieces : [];
        if (list.length > 0) {
          setState({ pieces: list, source: 'live', updatedAt: data.updatedAt ?? null });
        } else {
          setState({ pieces: FALLBACK_MUSEUM, source: 'fallback', updatedAt: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ pieces: FALLBACK_MUSEUM, source: 'fallback', updatedAt: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
