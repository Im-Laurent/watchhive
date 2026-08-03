import { useEffect, useState } from 'react';
import type { Video } from '../data/types';
import { FALLBACK_VIDEOS } from '../data/videos.fallback';

type State = {
  videos: Video[];
  source: 'live' | 'fallback' | 'loading';
  updatedAt: string | null;
};

/**
 * public/videos.json(GitHub Actions가 하루 1회 갱신)을 런타임에 읽는다.
 * 파일이 없거나·비었거나·요청 실패 시 하드코딩된 FALLBACK_VIDEOS로 떨어진다.
 * 캐시 우회를 위해 쿼리스트링을 붙이지 않고, HTTP 캐시는 브라우저에 맡긴다.
 */
export function useVideos(): State {
  const [state, setState] = useState<State>({
    videos: FALLBACK_VIDEOS,
    source: 'loading',
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}videos.json`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`videos.json ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list: Video[] = Array.isArray(data?.videos) ? data.videos : [];
        if (list.length > 0) {
          setState({ videos: list, source: 'live', updatedAt: data.updatedAt ?? null });
        } else {
          setState({ videos: FALLBACK_VIDEOS, source: 'fallback', updatedAt: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ videos: FALLBACK_VIDEOS, source: 'fallback', updatedAt: null });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
