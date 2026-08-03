// Watch HIVE — 빈시멍 채널 최신 영상 fetch (Shorts 제외)
// GitHub Actions에서 하루 1회 실행 → public/videos.json 생성.
// Node 20+ (전역 fetch 사용, 외부 의존성 없음).
//
// 필요한 환경변수:
//   YOUTUBE_API_KEY  (필수)  — GitHub Secret으로 주입
//   CHANNEL_ID       (선택)  — 기본값: 빈시멍 채널
//   MAX_RESULTS      (선택)  — 출력할 영상 수 (기본 12)
//   SHORTS_MAX_SEC   (선택)  — 이 길이(초) 이하는 Shorts로 간주 (기본 60)

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID || 'UC9YPdU50ZuFvqLnxw0HYmGA';
const MAX_RESULTS = Number(process.env.MAX_RESULTS || 12);
const SHORTS_MAX_SEC = Number(process.env.SHORTS_MAX_SEC || 60);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, '..', 'public', 'videos.json');

if (!API_KEY) {
  console.error('❌ YOUTUBE_API_KEY 환경변수가 필요합니다.');
  process.exit(1);
}

const API = 'https://www.googleapis.com/youtube/v3';

async function api(path, params) {
  const url = new URL(`${API}/${path}`);
  url.searchParams.set('key', API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`YouTube API ${path} 실패: ${res.status} ${body.slice(0, 300)}`);
  }
  return res.json();
}

// ISO8601 duration(PT#H#M#S) → 초
function parseDuration(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || '');
  if (!m) return 0;
  const [, h, mn, s] = m;
  return (Number(h) || 0) * 3600 + (Number(mn) || 0) * 60 + (Number(s) || 0);
}

// 카테고리는 'Watch Hunting' 과 'Review' 두 가지만 사용한다.
// 워치헌팅(시장·거리에서 직접 사러 다니는 영상)이 아니면 전부 'Review'.
const KNOWN_HUNTING = new Set([
  'vLLYrPZsUH4', 'srdbxEj2MEE', 's7JMpyDsJJQ', 'DLLx-twiJqg', 'Y--ywZkwQX4',
]);

function deriveCategory(id, title, desc) {
  if (KNOWN_HUNTING.has(id)) return 'Watch Hunting';
  const t = `${title} ${desc}`.toLowerCase();
  if (/(헌팅|hunting|사러|시장|아메요코|긴자|나카노|우에노|동묘|종로|예지동|시계여행|줍줍|쇼핑)/.test(t)) {
    return 'Watch Hunting';
  }
  return 'Review';
}

// `/shorts/{id}` 는 실제 Shorts면 200, 일반 영상이면 /watch 로 3xx 리다이렉트.
// 길이만으로는 판별 불가(YouTube Shorts는 최대 3분까지 허용되어 60초 필터를 빠져나감).
async function isShortByUrl(id) {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: 'HEAD',
      redirect: 'manual',
    });
    return res.status === 200; // 200 = Shorts, 3xx = 일반 영상
  } catch {
    return false; // 네트워크 실패 시 일반 영상으로 간주(과도한 필터 방지)
  }
}

async function isShort(video) {
  const sec = parseDuration(video.contentDetails?.duration);
  const text = `${video.snippet?.title || ''} ${video.snippet?.description || ''}`.toLowerCase();
  if (text.includes('#shorts')) return true;
  if (sec > 0 && sec <= SHORTS_MAX_SEC) return true;
  // 60초 초과여도 Shorts일 수 있으므로 URL 리다이렉트로 최종 판정.
  return isShortByUrl(video.id);
}

async function main() {
  // 1) 채널의 uploads 재생목록 ID
  const ch = await api('channels', { part: 'contentDetails', id: CHANNEL_ID });
  const uploads = ch.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error(`채널 uploads 재생목록을 찾을 수 없습니다: ${CHANNEL_ID}`);

  // 2) uploads에서 최근 영상 ID 수집 (최대 100개까지 훑어 Shorts 제외 후 채움)
  const ids = [];
  let pageToken = '';
  for (let page = 0; page < 2; page++) {
    const pl = await api('playlistItems', {
      part: 'contentDetails',
      playlistId: uploads,
      maxResults: '50',
      ...(pageToken ? { pageToken } : {}),
    });
    for (const it of pl.items || []) {
      if (it.contentDetails?.videoId) ids.push(it.contentDetails.videoId);
    }
    pageToken = pl.nextPageToken || '';
    if (!pageToken) break;
  }
  if (ids.length === 0) throw new Error('uploads에서 영상을 찾지 못했습니다.');

  // 3) videos.list로 상세(길이/제목) 조회 (50개씩 배치)
  const details = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const vs = await api('videos', { part: 'snippet,contentDetails', id: batch.join(',') });
    details.push(...(vs.items || []));
  }

  // 4) Shorts 제외(URL 판정 포함) + 최신순 정렬 + 상위 N개
  const shortFlags = await Promise.all(details.map((v) => isShort(v)));
  const videos = details
    .filter((_, i) => !shortFlags[i])
    .sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt))
    .slice(0, MAX_RESULTS)
    .map((v, idx) => ({
      id: idx + 1,
      youtubeId: v.id,
      title: v.snippet.title,
      description: (v.snippet.description || '').split('\n')[0].slice(0, 160),
      category: deriveCategory(v.id, v.snippet.title, v.snippet.description),
      publishedAt: v.snippet.publishedAt,
      thumbnail:
        v.snippet.thumbnails?.maxres?.url ||
        v.snippet.thumbnails?.high?.url ||
        `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
    }));

  if (videos.length === 0) throw new Error('Shorts 제외 후 남은 영상이 없습니다.');

  const payload = {
    updatedAt: new Date().toISOString(),
    channelId: CHANNEL_ID,
    count: videos.length,
    videos,
  };

  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  console.log(`✅ ${videos.length}개 영상 저장 → public/videos.json (Shorts 제외)`);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
