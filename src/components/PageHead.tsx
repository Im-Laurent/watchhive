import { useEffect } from 'react';
import { SITE } from '../data/pageMeta';

type Props = {
  title: string;
  description?: string;
  /** 링크 미리보기 전용 문구. 없으면 description 을 그대로 쓴다. */
  ogDescription?: string;
  path: string;
  /** 링크 미리보기 카드에 뜨는 1200x630 이미지. public 기준 절대 경로. */
  image?: string;
  imageAlt?: string;
};

/** 라우트별 카드가 없을 때 쓰는 대문 이미지 */
const DEFAULT_IMAGE = '/images/og/home.jpg';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

/**
 * React 19는 컴포넌트에서 렌더된 <title>/<meta>/<link>를 자동으로 <head>로 hoisting한다.
 * 별도 Helmet 라이브러리 없이 페이지별 메타데이터를 관리한다.
 *
 * 단, 카카오톡·페이스북 같은 링크 미리보기 크롤러는 JS를 실행하지 않아 여기서 만든 태그를
 * 보지 못한다. 그래서 같은 값을 scripts/prerender.mjs가 라우트별 정적 HTML로도 구워두고
 * (data-prerendered), 앱이 뜨면 아래에서 그 사본을 걷어내 중복을 남기지 않는다.
 */
export default function PageHead({ title, description, ogDescription, path, image, imageAlt }: Props) {
  useEffect(() => {
    document.head.querySelectorAll('[data-prerendered]').forEach((el) => el.remove());
  }, []);

  const fullTitle = title === 'Watch HIVE' ? title : `${title} · Watch HIVE`;
  const canonical = `${SITE}${path}`;
  const imageUrl = `${SITE}${image || DEFAULT_IMAGE}`;
  // description 은 구글 검색 스니펫, preview 는 카카오톡·페이스북 카드에 뜨는 문구다.
  const preview = ogDescription || description;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      {preview && <meta property="og:description" content={preview} />}
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta name="twitter:title" content={fullTitle} />
      {preview && <meta name="twitter:description" content={preview} />}
      <meta name="twitter:image" content={imageUrl} />
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
    </>
  );
}
