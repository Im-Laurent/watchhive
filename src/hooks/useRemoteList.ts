import { useEffect, useState } from 'react';

export type RemoteListState<T> = {
  items: T[];
  source: 'live' | 'fallback' | 'loading';
  updatedAt: string | null;
};

/**
 * public/ 아래의 정적 JSON 목록을 런타임에 읽고, 못 읽으면 번들에 들어 있는 사본으로 떨어진다.
 *
 * videos.json(GitHub Actions 가 하루 1회 갱신)과 museum.json(명화 프로젝트의 export 스크립트가
 * 굽는다)이 같은 모양이라 한 벌로 둔다. 파일이 없거나 · 비었거나 · 요청이 실패하면 fallback 이다.
 * 캐시 우회를 위해 쿼리스트링을 붙이지 않고, HTTP 캐시는 브라우저에 맡긴다.
 *
 * @param fileName public 기준 파일 이름 (예: 'videos.json')
 * @param listKey  JSON 안에서 목록이 들어 있는 키 (예: 'videos')
 * @param fallback 못 읽었을 때 쓸 목록
 */
export function useRemoteList<T>(fileName: string, listKey: string, fallback: T[]): RemoteListState<T> {
  const [state, setState] = useState<RemoteListState<T>>({
    items: fallback,
    source: 'loading',
    updatedAt: null,
  });

  useEffect(() => {
    let cancelled = false;
    fetch(`${import.meta.env.BASE_URL}${fileName}`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`${fileName} ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const list: T[] = Array.isArray(data?.[listKey]) ? data[listKey] : [];
        if (list.length > 0) {
          setState({ items: list, source: 'live', updatedAt: data.updatedAt ?? null });
        } else {
          setState({ items: fallback, source: 'fallback', updatedAt: null });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ items: fallback, source: 'fallback', updatedAt: null });
      });
    return () => {
      cancelled = true;
    };
    // fallback 은 모듈 상수라 신원이 바뀌지 않는다. fileName/listKey 도 호출부에서 리터럴로 고정된다.
  }, [fileName, listKey, fallback]);

  return state;
}
