/**
 * 유튜브 썸네일 주소와 폴백 사슬.
 *
 * maxresdefault(1280x720)는 업로드 당시 해상도가 낮았던 영상에는 아예 없어서 깨진 이미지가 뜬다.
 * 없으면 hq → mq 순으로 내려간다. 마지막 mq 는 모든 영상에 있다.
 */
const FALLBACK_CHAIN = ['maxresdefault', 'hqdefault', 'mqdefault'] as const;

export const BEST_THUMBNAIL_QUALITY = FALLBACK_CHAIN[0];

export function thumbnailUrl(youtubeId: string, quality: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/${quality}.jpg`;
}

/** 지금 실패한 주소 다음에 시도할 주소. 더 내려갈 곳이 없으면 null — 무한 재시도를 막는다. */
export function nextThumbnailUrl(youtubeId: string, currentSrc: string): string | null {
  const index = FALLBACK_CHAIN.findIndex((q) => currentSrc.includes(q));
  const next = index === -1 ? undefined : FALLBACK_CHAIN[index + 1];
  return next ? thumbnailUrl(youtubeId, next) : null;
}
