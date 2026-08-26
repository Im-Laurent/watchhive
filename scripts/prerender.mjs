/**
 * 라우트별 정적 HTML을 굽는다 (vite build 이후 실행).
 *
 * 카카오톡·페이스북·X 의 링크 미리보기 크롤러는 JS를 실행하지 않는다. 이 앱은 SPA라
 * <meta>를 React가 런타임에 붙이므로, 크롤러가 /timegrapher 를 긁으면 아무것도 못 본다.
 * (게다가 GitHub Pages에는 /timegrapher 파일이 없어 404.html이 응답한다.)
 *
 * 그래서 dist/<route>/index.html 을 index.html 사본으로 만들고, <!-- prerender:meta -->
 * 블록만 그 라우트의 값으로 갈아 끼운다. 값의 출처는 src/data/pageMeta.json 하나뿐이라
 * PageHead가 런타임에 붙이는 태그와 어긋나지 않는다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://www.watch-hive.com';
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;

const START = '<!-- prerender:meta -->';
const END = '<!-- /prerender:meta -->';

const PAGE_META = JSON.parse(readFileSync(join(ROOT, 'src/data/pageMeta.json'), 'utf8'));

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** PageHead.tsx가 렌더하는 것과 같은 태그 묶음 */
function metaBlock(meta) {
  const fullTitle = meta.title === 'Watch HIVE' ? meta.title : `${meta.title} · Watch HIVE`;
  const url = `${SITE}${meta.path}`;
  const image = `${SITE}${meta.image}`;
  return [
    `<title data-prerendered>${esc(fullTitle)}</title>`,
    `<meta data-prerendered name="description" content="${esc(meta.description)}" />`,
    `<link data-prerendered rel="canonical" href="${esc(url)}" />`,
    `<meta data-prerendered property="og:title" content="${esc(fullTitle)}" />`,
    `<meta data-prerendered property="og:description" content="${esc(meta.description)}" />`,
    `<meta data-prerendered property="og:url" content="${esc(url)}" />`,
    `<meta data-prerendered property="og:image" content="${esc(image)}" />`,
    `<meta data-prerendered property="og:image:width" content="${OG_IMAGE_WIDTH}" />`,
    `<meta data-prerendered property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`,
    `<meta data-prerendered property="og:image:alt" content="${esc(meta.imageAlt)}" />`,
    `<meta data-prerendered name="twitter:title" content="${esc(fullTitle)}" />`,
    `<meta data-prerendered name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta data-prerendered name="twitter:image" content="${esc(image)}" />`,
    `<meta data-prerendered name="twitter:image:alt" content="${esc(meta.imageAlt)}" />`,
  ]
    .map((tag) => `    ${tag}`)
    .join('\n');
}

const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
const from = shell.indexOf(START);
const to = shell.indexOf(END);
if (from === -1 || to === -1) {
  throw new Error(`index.html에서 ${START} … ${END} 마커를 찾지 못했습니다.`);
}

for (const meta of Object.values(PAGE_META)) {
  const html = `${shell.slice(0, from + START.length)}\n${metaBlock(meta)}\n    ${shell.slice(to)}`;
  // '/' 는 dist/index.html 자신, 나머지는 dist/<route>/index.html (GitHub Pages가 디렉터리 인덱스로 서빙)
  const outDir = meta.path === '/' ? DIST : join(DIST, meta.path.replace(/^\//, ''));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  console.log(`prerendered ${meta.path.padEnd(14)} → ${join(outDir, 'index.html').slice(DIST.length + 1)}`);
}
