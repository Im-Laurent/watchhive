import type { Video } from '../data/types';
import { FALLBACK_VIDEOS } from '../data/videos.fallback';
import { useRemoteList } from './useRemoteList';

/** public/videos.json(GitHub Actions가 하루 1회 갱신)을 읽는다. 자세한 규칙은 useRemoteList 참고. */
export function useVideos() {
  const { items, source, updatedAt } = useRemoteList<Video>('videos.json', 'videos', FALLBACK_VIDEOS);
  return { videos: items, source, updatedAt };
}
