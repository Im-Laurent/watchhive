import type { BrandGuide } from './types';

// NOTE: imageUrl은 기존 외부 GitHub Pages 호스트를 가리킵니다.
// Phase 3에서 로컬 자산(public/images/)으로 교체 예정.
export const BRAND_GUIDES: Record<string, BrandGuide> = {
  Rolex: { title: 'Rolex 시리얼넘버 조회 가이드', imageUrl: 'https://im-laurent.github.io/watchhive/롤렉스.jpg', description: '시리얼 번호는 어디에 있나요?\nRolex 시계의 시리얼 번호는 주로 케이스백 내부 또는 무브먼트에 각인되어 있습니다.\n정확한 위치는 모델과 생산 시기에 따라 다를 수 있습니다.\n\n몇년도 까지 조회할 수 있나요?\n확보 가능한 자료를 토대로 만들었기 때문에 제한된 범위만 조회할 수 있습니다.\n롤렉스의 시리얼 번호는 1954년부터 1987년까지의 생산년도만 지원합니다.\n이외의 연도는 조회 대상에서 제외됩니다.' },
  IWC: { title: 'IWC 시리얼넘버 조회 가이드', imageUrl: 'https://im-laurent.github.io/watchhive/iwcserials.webp', description: '시리얼 번호는 어디에 있나요?\nIWC 시계의 시리얼 번호는 주로 케이스백 내부 또는 무브먼트에 각인되어 있습니다.\n정확한 위치는 모델과 생산 시기에 따라 다를 수 있습니다.\n\n몇년도 까지 조회할 수 있나요?\n확보 가능한 자료를 토대로 만들었기 때문에 제한된 범위만 조회할 수 있습니다.\nIWC의 시리얼 번호는 1884년부터 1975년까지의 생산년도만 지원합니다.\n이외의 연도는 조회 대상에서 제외됩니다.' },
  Omega: { title: 'Omega 시리얼넘버 조회 가이드', imageUrl: 'https://im-laurent.github.io/watchhive/오메가ETA.jpg', description: '시리얼 번호는 어디에 있나요?\n오메가 최신 모델은 케이스 뒷면에 작게 각인되어 있습니다.\n오메가 빈티지 모델은 무브먼트에 각인되어 있는 긴 자리의 숫자입니다.\n\n몇년도 까지 조회할 수 있나요?\n확보 가능한 자료를 토대로 만들었기 때문에 제한된 범위만 조회할 수 있습니다.\n오메가의 1,000,000번대 부터 51,000,000번대 까지의 번호만 지원합니다.\n이는 1895~1989년도 생산된 오메가 시계의 생산년도에 해당합니다.\n스피드 마스터는 조회 대상에서 제외됩니다.' },
  Longines: { title: 'Longines 시리얼넘버 조회 가이드', imageUrl: 'https://im-laurent.github.io/watchhive/론진.jpg', description: '시리얼 번호는 어디에 있나요?\nLongines 시계의 시리얼 번호는 주로 무브먼트에 각인되어 있습니다.\n정확한 위치는 모델과 생산 시기에 따라 다를 수 있습니다.\n\n몇년도 까지 조회할 수 있나요?\n확보 가능한 자료를 토대로 만들었기 때문에 제한된 범위만 조회할 수 있습니다.\nLongines의 시리얼 번호는 1867년부터 1969년까지의 생산년도만 지원합니다.\n이외의 연도는 조회 대상에서 제외됩니다.' },
  UniversalGenève: { title: 'Universal Genève 시리얼넘버 조회 가이드', imageUrl: 'https://im-laurent.github.io/watchhive/universalgeneveserials1.jpg', description: '시리얼 번호는 어디에 있나요?\nUniversal Genève 시계의 시리얼 번호는 주로 케이스백 내부 또는 무브먼트에 각인되어 있습니다.\n정확한 위치는 모델과 생산 시기에 따라 다를 수 있습니다.\n\n몇년도 까지 조회할 수 있나요?\n확보 가능한 자료를 토대로 만들었기 때문에 제한된 범위만 조회할 수 있습니다.\nUniversal Genève의 시리얼 번호는 1930년부터 1967년까지의 생산년도만 지원합니다.\n이외의 연도는 조회 대상에서 제외됩니다.' },
};
