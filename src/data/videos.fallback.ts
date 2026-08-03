import type { Video } from './types';

// 유튜브 자동화(Phase 4) 실패 시 사용하는 fallback 목록.
export const FALLBACK_VIDEOS: Video[] = [
  { id: 1, title: '도쿄 우에노. 일본 빈티지 시계 천국, 직접 가봤습니다', category: 'Watch Hunting', youtubeId: 'vLLYrPZsUH4', description: '우에노 아메요코 시장의 빈티지 시계점들과 즐길 거리들을 소개합니다.' },
  { id: 2, title: '도쿄 긴자. 빈티지 시계 쇼핑의 모든 것. 완벽 코스 가이드', category: 'Watch Hunting', youtubeId: 'srdbxEj2MEE', description: '도쿄 긴자의 빈티지 시계점 5선과 즐길 거리를 다룬 영상.' },
  { id: 3, title: '도쿄 긴자. 진짜 일본 부자들이 시계 사는곳 가봤는데요. 미쳤습니다', category: 'Watch Hunting', youtubeId: 's7JMpyDsJJQ', description: '평당 18억. 일본에서 가장 비싼 땅에 세이코 하우스가 있는 이유.' },
  { id: 4, title: '도쿄 나카노. 일본서 시계 살거면 그냥 여기 가세요', category: 'Watch Hunting', youtubeId: 'DLLx-twiJqg', description: '일본 빈티지 시계의 성지 나카노를 처음 방문하신다면 꼭 봐야 할 영상입니다.' },
  { id: 5, title: '요즘 해외에서 난리난 교토 시계여행 코스 도대체 뭐길래?', category: 'Watch Hunting', youtubeId: 'Y--ywZkwQX4', description: '교토에서 무슨 시계여행이냐고요? 교토 브랜드 KUOE와 시계탐방 동선을 소개합니다.' },
  { id: 6, title: '인도네시아 발리. 한국에선 상상 못할 발리의 시계', category: 'Insight', youtubeId: 'p3zrB9EPpNY', description: '발리의 충격적인 시계점과, 빈티지 시계점, 즐길거리를 다룬 영상' },
  { id: 7, title: '세이코 로토콜. 우주와 심해를 모두 정복한 단 하나의 시계', category: 'My Watch Collection', youtubeId: 'F1-qHczSpL0', description: '무려 3,200만원에 낙찰된 세이코 전자시계의 숨겨진 이야기.' },
  { id: 8, title: '조용히 가격 상승 중인 나만 알고 싶은 시계. 론진 옥타곤 3209 빈티지', category: 'Tips', youtubeId: 'xY1LA-Y7O9s', description: '빈티지 론진 옥타곤 3209에 대한 가격, 디자인, 스펙, 단점 리뷰' },
  { id: 9, title: '빈티지 시계 사이즈는 이렇게 차세요', category: 'Tips', youtubeId: 'Ap5p3d3RO7E', description: '시계 사이즈와 생산년도를 찾아주는 서비스를 만들었습니다.' },
];
