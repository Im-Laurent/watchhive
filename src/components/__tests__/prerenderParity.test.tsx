import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PageHead from '../PageHead';
import { PAGE_META, SITE } from '../../data/pageMeta';
// @ts-expect-error - 빌드 스크립트라 타입 선언이 없다. metaBlock 하나만 가져다 쓴다.
import { metaBlock } from '../../../scripts/prerender.mjs';

/**
 * PageHead(런타임)와 scripts/prerender.mjs(빌드 시점)는 같은 <meta> 묶음을 따로 만든다.
 * 크롤러는 JS를 실행하지 않아 정적 HTML이 필요하고, 앱은 라우트를 옮길 때 태그를 갈아야 하기
 * 때문이라 이 중복은 의도된 것이다 — 다만 어긋나면 검색 결과와 링크 미리보기가 서로 다른 말을
 * 하게 되고, 그 사실이 배포 후에야 드러난다. 두 벌이 같은 값을 내는지 여기서 묶어 둔다.
 */

type TagSet = Record<string, string>;

/** PageHead 가 실제로 <head> 에 붙인 태그를 키:값으로 걷어 온다. */
function renderedTags(meta: (typeof PAGE_META)[keyof typeof PAGE_META]): TagSet {
  document.head.innerHTML = '';
  render(<PageHead {...meta} />);

  const tags: TagSet = {};
  const title = document.head.querySelector('title');
  if (title) tags.title = title.textContent ?? '';
  const canonical = document.head.querySelector('link[rel="canonical"]');
  if (canonical) tags.canonical = canonical.getAttribute('href') ?? '';
  document.head.querySelectorAll('meta').forEach((el) => {
    const key = el.getAttribute('property') ?? el.getAttribute('name');
    if (key) tags[key] = el.getAttribute('content') ?? '';
  });
  return tags;
}

/** prerender 가 만든 HTML 문자열에서 같은 모양으로 걷어 온다. */
function prerenderedTags(meta: unknown): TagSet {
  const host = document.createElement('div');
  host.innerHTML = (metaBlock as (m: unknown) => string)(meta).replace(/<title/g, '<x-title').replace(/<\/title>/g, '</x-title>');

  const tags: TagSet = {};
  const title = host.querySelector('x-title');
  if (title) tags.title = title.textContent ?? '';
  const canonical = host.querySelector('link[rel="canonical"]');
  if (canonical) tags.canonical = canonical.getAttribute('href') ?? '';
  host.querySelectorAll('meta').forEach((el) => {
    const key = el.getAttribute('property') ?? el.getAttribute('name');
    if (key) tags[key] = el.getAttribute('content') ?? '';
  });
  return tags;
}

const ROUTES = Object.entries(PAGE_META);

describe('PageHead 와 prerender 의 메타 태그가 일치한다', () => {
  it.each(ROUTES)('%s', (_key, meta) => {
    expect(renderedTags(meta)).toEqual(prerenderedTags(meta));
  });
});

describe('메타 값 자체의 규칙', () => {
  it.each(ROUTES)('%s: 제목에 사이트 이름이 붙는다 (홈 제외)', (_key, meta) => {
    const { title } = renderedTags(meta);
    expect(title).toBe(meta.title === 'Watch HIVE' ? 'Watch HIVE' : `${meta.title} · Watch HIVE`);
  });

  it.each(ROUTES)('%s: canonical 과 og:url 이 같고 정식 도메인을 쓴다', (_key, meta) => {
    const tags = renderedTags(meta);
    expect(tags.canonical).toBe(`${SITE}${meta.path}`);
    expect(tags['og:url']).toBe(tags.canonical);
  });

  it.each(ROUTES)('%s: og:image 는 절대 주소다 — 크롤러는 상대 주소를 못 읽는다', (_key, meta) => {
    const tags = renderedTags(meta);
    expect(tags['og:image']).toBe(`${SITE}${meta.image}`);
    expect(tags['og:image']).toMatch(/^https:\/\//);
  });

  it.each(ROUTES)('%s: 미리보기 문구는 ogDescription 이 있으면 그것을 쓴다', (_key, meta) => {
    const tags = renderedTags(meta);
    expect(tags['og:description']).toBe(meta.ogDescription ?? meta.description);
    expect(tags['twitter:description']).toBe(tags['og:description']);
  });

  it.each(ROUTES)('%s: 검색 스니펫은 언제나 description 이다', (_key, meta) => {
    expect(renderedTags(meta).description).toBe(meta.description);
  });

  it('라우트마다 canonical 이 겹치지 않는다', () => {
    const paths = ROUTES.map(([, meta]) => meta.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('SITE 는 슬래시로 끝나지 않는다 — path 와 이어 붙일 때 //가 생긴다', () => {
    expect(SITE.endsWith('/')).toBe(false);
  });
});

describe('PageHead 는 프리렌더된 사본을 걷어낸다', () => {
  it('data-prerendered 태그를 지워 중복을 남기지 않는다', () => {
    document.head.innerHTML = '<meta data-prerendered name="description" content="굽힌 값" />';
    render(<PageHead {...PAGE_META.home} />);
    expect(document.head.querySelectorAll('[data-prerendered]')).toHaveLength(0);
  });
});
