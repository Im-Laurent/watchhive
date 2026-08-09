// Watch HIVE — Google Takeout(저장한 장소.json, GeoJSON) → public/places.candidates.json
// 어드민(/admin, 개발 전용)이 로드하는 "전체 후보 풀"을 생성한다.
// Node 20+ (외부 의존성 없음).
//
// 사용법:
//   node scripts/build-candidates.mjs [입력파일경로]
//   - 인자 미지정 시: 환경변수 TAKEOUT_FILE, 그다음 프로젝트 루트의 takeout/ 폴더 내 첫 .json
//
// 출력: public/places.candidates.json  (이 파일은 .gitignore 처리 → 배포 안 됨)

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'public', 'places.candidates.json');

// ── 입력 파일 결정 ────────────────────────────────────────────────
async function resolveInput() {
  const arg = process.argv[2];
  if (arg) return isAbsolute(arg) ? arg : resolve(process.cwd(), arg);
  if (process.env.TAKEOUT_FILE) return process.env.TAKEOUT_FILE;
  const dir = join(ROOT, 'takeout');
  if (existsSync(dir)) {
    const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.json'));
    if (files.length) return join(dir, files[0]);
  }
  return null;
}

// ── 지역 판별 ────────────────────────────────────────────────────
// 대략적인 바운딩 박스. 겹칠 수 있어 hongkong→shanghai→korea→japan 순으로 검사.
function regionFromCoords(lat, lng) {
  if (lat == null || lng == null) return null;
  if (lat >= 22.1 && lat <= 22.7 && lng >= 113.8 && lng <= 114.5) return 'hongkong';
  if (lat >= 30.5 && lat <= 31.9 && lng >= 120.8 && lng <= 122.1) return 'shanghai';
  if (lat >= 33.0 && lat <= 39.5 && lng >= 124.0 && lng <= 132.0) return 'korea';
  if (lat >= 30.0 && lat <= 46.0 && lng >= 129.0 && lng <= 146.0) return 'japan';
  return null;
}

function regionFromText(country, text) {
  const t = `${country || ''} ${text || ''}`.toLowerCase();
  if (country === 'HK' || /香港|hong ?kong|홍콩/.test(t)) return 'hongkong';
  if (country === 'JP' || /日本|japan|tokyo|東京|kyoto|京都|일본|도쿄|교토/.test(t)) return 'japan';
  if (country === 'KR' || /한국|korea|서울|seoul|종로|동묘/.test(t)) return 'korea';
  // 중국은 이 앱 범위상 상하이만 다룬다.
  if (country === 'CN' || /上海|shanghai|상하이|상해|중국|china/.test(t)) return 'shanghai';
  return null;
}

// ── 시계 업종 추정 ────────────────────────────────────────────────
const WATCH_RE =
  /시계|watch|watches|時計|时计|鐘錶|钟表|鐘表|錶行|錶|rolex|seiko|omega|longines|patek|vintage|골동|antique|horolog|時錶|우치/i;

function isWatch(name, address) {
  return WATCH_RE.test(`${name || ''} ${address || ''}`);
}

// ── URL 파싱 헬퍼 ────────────────────────────────────────────────
function parseUrl(u) {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

// ftid "0xAAA:0xBBB" 의 두 번째 16진수 → 10진수 CID
function cidFromFtid(ftid) {
  if (!ftid || !ftid.includes(':')) return null;
  const hex = ftid.split(':')[1];
  try {
    return BigInt(hex).toString();
  } catch {
    return null;
  }
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// ── feature 정규화 ───────────────────────────────────────────────
function normalize(feature) {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [];
  let lng = typeof coords[0] === 'number' ? coords[0] : null;
  let lat = typeof coords[1] === 'number' ? coords[1] : null;
  if ((lat === 0 && lng === 0) || lat == null || lng == null) {
    lat = null;
    lng = null;
  }

  const loc = props.location || {};
  const url = props.google_maps_url || '';
  const parsed = parseUrl(url);
  const q = parsed?.searchParams.get('q') || null; // URLSearchParams가 %XX·+ 자동 디코딩
  const ftid = parsed?.searchParams.get('ftid') || null;
  const cidParam = parsed?.searchParams.get('cid') || null;

  const name = loc.name || null;
  const address = loc.address || q || null;
  const countryCode = loc.country_code || null;
  const cid = cidParam || cidFromFtid(ftid);

  const region = regionFromCoords(lat, lng) || regionFromText(countryCode, `${name || ''} ${address || ''}`);

  const id = cid ? `cid-${cid}` : `p-${simpleHash(url || name || JSON.stringify(coords))}`;

  return {
    id,
    name,
    address,
    lat,
    lng,
    cid,
    placeId: null, // Takeout에는 ChIJ 형태 place_id가 없음(Embed는 name+address로 대체)
    googleUrl: url,
    countryCode,
    hasLocation: lat != null && lng != null,
    region,
    isWatchGuess: isWatch(name, address),
    savedAt: props.date || null,
  };
}

async function main() {
  const input = await resolveInput();
  if (!input) {
    console.error(
      '❌ 입력 Takeout 파일을 찾을 수 없습니다.\n' +
        '   node scripts/build-candidates.mjs "<저장한 장소.json 경로>" 로 지정하거나\n' +
        '   프로젝트 루트의 takeout/ 폴더에 .json 을 넣어주세요.'
    );
    process.exit(1);
  }

  const raw = await readFile(input, 'utf8');
  const geo = JSON.parse(raw);
  const features = Array.isArray(geo?.features) ? geo.features : [];
  const candidates = features.map(normalize);

  // id 중복 제거(마지막 우선)
  const byId = new Map();
  for (const c of candidates) byId.set(c.id, c);
  const list = [...byId.values()];

  const payload = {
    updatedAt: new Date().toISOString(),
    source: input,
    count: list.length,
    watchGuessCount: list.filter((c) => c.isWatchGuess).length,
    missingCoords: list.filter((c) => !c.hasLocation).length,
    candidates: list,
  };

  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(
    `✅ ${list.length}개 후보 → public/places.candidates.json ` +
      `(시계추정 ${payload.watchGuessCount}, 좌표없음 ${payload.missingCoords})`
  );
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
