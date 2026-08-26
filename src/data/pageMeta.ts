import meta from './pageMeta.json';

/**
 * 페이지별 메타데이터(제목·설명·OG 이미지)와 정식 도메인의 유일한 출처.
 *
 * JSON 으로 둔 이유: 이 값들을 React 뿐 아니라 빌드 후 실행되는 프리렌더 스크립트
 * (scripts/prerender.mjs)도 읽어야 하기 때문이다. 카카오톡·페이스북 같은 링크 미리보기
 * 크롤러는 JS 를 실행하지 않아서, 라우트별 <meta> 를 정적 HTML 로도 한 벌 구워야 한다.
 */
export type PageMeta = {
  title: string;
  description: string;
  path: string;
  image: string;
  imageAlt: string;
};

/**
 * canonical·og:url·og:image 가 기준으로 삼는 도메인.
 * public/CNAME 과 반드시 같아야 한다 — www 는 GitHub Pages 가 이쪽으로 301 하고,
 * Worker 의 ALLOWED_ORIGINS 도 이 주소만 허용한다.
 */
export const SITE: string = meta.site;

export const PAGE_META: Record<keyof typeof meta.pages, PageMeta> = meta.pages;
