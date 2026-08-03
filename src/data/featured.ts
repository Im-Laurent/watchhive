import type { Video } from './types';

// 홈 하단 "추천 영상" — 자동 갱신하지 않고 수동으로만 관리한다.
// 교체하려면 `update-home-video` 스킬(트리거: "홈 영상 업데이트/교체", "홈탭 추천영상 수정")을
// 사용하거나, 아래 값을 직접 수정한 뒤 build + deploy 를 실행한다.
export const FEATURED_VIDEO: Pick<Video, 'youtubeId' | 'title' | 'description'> = {
  youtubeId: `vLLYrPZsUH4`,
  title: `도쿄 우에노. 일본 빈티지 시계 천국, 직접 가봤습니다`,
  description: `🗼일본 도쿄 시계여행 우에노 빈티지편. 우에노 시계 딜러샵의 특징과 가격, 꼭 가야 할 빈티지 시계점 추천까지 — 아메요코 시장의 빈티지 시계점 7선과 즐길 거리를 담았습니다.`,
};
