import type { MuseumPiece } from '../data/types';
import { FALLBACK_MUSEUM } from '../data/museum.fallback';
import { useRemoteList } from './useRemoteList';

/**
 * public/museum.json 을 읽는다. 이 파일은 명화 프로젝트의 scripts/export_to_site.py 가 굽는다
 * — 명제표 문구의 출처는 거기 세 DB 뿐이다. 자세한 규칙은 useRemoteList 참고.
 */
export function useMuseum() {
  const { items, source, updatedAt } = useRemoteList<MuseumPiece>('museum.json', 'pieces', FALLBACK_MUSEUM);
  return { pieces: items, source, updatedAt };
}
