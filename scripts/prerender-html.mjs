/**
 * 빌드된 SPA를 Puppeteer로 열어 각 라우트의 렌더링된 HTML 본문을 캡처한다.
 *
 * 실행 순서: vite build → prerender.mjs (메타 태그) → 이 스크립트 (본문 HTML)
 *
 * prerender.mjs 가 <title>, og:*, canonical 등 메타 태그를 정적으로 심어 주지만,
 * <div id="root"></div> 안의 본문은 비어 있다. 구글봇은 JS를 실행할 수 있지만
 * 2차 렌더링 큐에 들어가므로 색인이 느리고 불안정하다.
 *
 * 이 스크립트는 Puppeteer로 각 라우트를 열어 렌더링된 #root 안의 HTML을
 * 정적 파일에 삽입한다. 구글봇이 JS 없이도 본문을 읽을 수 있게 된다.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import puppeteer from 'puppeteer';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const PORT = 4173;

const { pages: PAGE_META } = JSON.parse(
  readFileSync(join(ROOT, 'src/data/pageMeta.json'), 'utf8'),
);

/* ------------------------------------------------------------------ */
/*  간이 정적 파일 서버 (SPA 폴백 포함)                                  */
/* ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function serveDist() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);
      let filePath = join(DIST, decodeURIComponent(url.pathname));

      // 디렉터리면 index.html 시도
      if (existsSync(filePath) && !extname(filePath)) {
        const idx = join(filePath, 'index.html');
        if (existsSync(idx)) filePath = idx;
      }

      // 파일이 없으면 SPA 폴백 → 루트 index.html
      if (!existsSync(filePath) || !extname(filePath)) {
        filePath = join(DIST, 'index.html');
      }

      const ext = extname(filePath).toLowerCase();
      const contentType = MIME[ext] || 'application/octet-stream';

      try {
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

/* ------------------------------------------------------------------ */
/*  메인                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  const server = await serveDist();
  console.log(`\n🌐 dist 서빙 중 — http://127.0.0.1:${PORT}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',   // CI 환경 /dev/shm 부족 방지
      '--disable-gpu',
    ],
  });

  let ok = 0;

  try {
    for (const [key, meta] of Object.entries(PAGE_META)) {
      const page = await browser.newPage();

      // 불필요한 리소스(이미지, 폰트, 미디어) 차단 → 속도 향상
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const type = req.resourceType();
        if (['image', 'font', 'media'].includes(type)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      const url = `http://127.0.0.1:${PORT}${meta.path}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });

        // React 렌더링이 끝날 때까지 대기
        await page.waitForSelector('#root > *', { timeout: 10_000 });

        // 약간의 여유 — 비동기 상태 업데이트 마무리
        await page.evaluate(() => new Promise((r) => setTimeout(r, 500)));

        // #root 안의 렌더링된 HTML 캡처
        const rootHTML = await page.$eval('#root', (el) => el.innerHTML);

        if (!rootHTML || rootHTML.length < 50) {
          console.warn(`⚠️  ${meta.path} — 캡처된 HTML이 너무 짧음 (${rootHTML.length}자), 건너뜀`);
          await page.close();
          continue;
        }

        // 해당 라우트의 정적 HTML 파일 찾기
        const htmlPath =
          meta.path === '/'
            ? join(DIST, 'index.html')
            : join(DIST, meta.path.replace(/^\//, ''), 'index.html');

        if (!existsSync(htmlPath)) {
          console.warn(`⚠️  ${htmlPath} 파일 없음, 건너뜀`);
          await page.close();
          continue;
        }

        let html = readFileSync(htmlPath, 'utf8');

        // 빈 #root를 렌더링된 콘텐츠로 교체
        html = html.replace(
          '<div id="root"></div>',
          `<div id="root">${rootHTML}</div>`,
        );

        writeFileSync(htmlPath, html, 'utf8');
        ok++;
        console.log(
          `✅ ${meta.path.padEnd(16)} → ${rootHTML.length.toLocaleString().padStart(7)}자 삽입`,
        );
      } catch (err) {
        console.error(`❌ ${meta.path} 실패:`, err.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n프리렌더링 완료: ${ok}/${Object.keys(PAGE_META).length} 페이지\n`);

  if (ok === 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('프리렌더링 실패:', err);
  process.exit(1);
});
