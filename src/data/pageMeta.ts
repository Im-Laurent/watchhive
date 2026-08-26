import meta from './pageMeta.json';

/**
 * 페이지별 메타데이터(제목·설명·OG 이미지)의 유일한 출처.
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

export const PAGE_META: Record<keyof typeof meta, PageMeta> = meta;
