import type { Video } from './types';

// 홈 하단 "추천 영상" — 자동 갱신하지 않고 수동으로만 관리한다.
// 교체하려면 `update-home-video` 스킬(트리거: "홈 영상 업데이트/교체", "홈탭 추천영상 수정")을
// 사용하거나, 아래 값을 직접 수정한 뒤 build + deploy 를 실행한다.
export const FEATURED_VIDEO: Pick<Video, 'youtubeId' | 'title' | 'description'> = {
  youtubeId: 'CZBu68vFik4',
  title: "7천억 자산 '마이클잭슨'의 애착시계... 고작 11만원? 드디어 손에 넣었습니다.",
  description:
    "🕺마이클 잭슨이 아껴 찼던 시계. 훗날 대한민국 학생들의 로망이 됐던 '그' 브랜드. 'ALBA' 의 과거와 현재를 소개합니다.",
};
