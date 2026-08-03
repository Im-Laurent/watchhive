type Props = {
  title: string;
  description?: string;
  path: string;
};

const SITE = 'https://www.watch-hive.com';

/**
 * React 19는 컴포넌트에서 렌더된 <title>/<meta>/<link>를 자동으로 <head>로 hoisting한다.
 * 별도 Helmet 라이브러리 없이 페이지별 메타데이터를 관리한다.
 */
export default function PageHead({ title, description, path }: Props) {
  const fullTitle = title === 'Watch HIVE' ? title : `${title} · Watch HIVE`;
  const canonical = `${SITE}${path}`;
  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
    </>
  );
}
