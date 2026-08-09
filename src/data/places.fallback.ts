import type { WatchPlace } from './types';

// public/places.json fetch 실패 시 사용하는 fallback 시드.
// 어드민(/admin)에서 큐레이션해 내보낸 places.json 이 실제 소스이며,
// 여기에는 대표 시계점 몇 곳만 하드코딩한다.
export const PLACES_FALLBACK: WatchPlace[] = [
  {
    id: 'cid-804514358996131088',
    name: 'Shanghai Watches',
    address: '16 Yuyuanlao St, Huangpu, Shanghai 200120',
    lat: 31.22754,
    lng: 121.49132,
    region: 'shanghai',
    placeId: null,
    note: '',
    googleUrl: 'http://maps.google.com/?cid=804514358996131088',
  },
];
