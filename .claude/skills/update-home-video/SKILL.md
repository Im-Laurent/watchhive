---
name: update-home-video
description: >-
  Watch HIVE 홈 하단 "추천 영상"을 수동으로 교체한다. 사용자가 "홈 영상 업데이트",
  "홈 영상 교체", "홈탭 추천영상 수정", "추천영상 바꿔줘" 처럼 홈 추천 영상 변경을
  요청할 때 사용. 유튜브 URL을 물어보고 → 제목(메타정보)을 확인받은 뒤 →
  src/data/featured.ts 수정 → 커밋·푸시·배포까지 수행한다. 자동 갱신되는 Videos
  목록(videos.json)과는 별개이며, 이 스킬로만 바뀐다.
---

# 홈 추천 영상 교체 (update-home-video)

Watch HIVE 홈(`/`) 하단 **"추천 영상"** 카드는 자동 갱신되지 않고 이 스킬로만 교체한다.
데이터는 `src/data/featured.ts` 의 `FEATURED_VIDEO` 한 개다. (Videos 탭의 자동 목록
`public/videos.json` 과는 완전히 별개다 — 그쪽은 건드리지 않는다.)

**작업 리포:** `C:\Users\inchun\OneDrive\Desktop\AI\watch-hive\watch-hive\my-react-app`
모든 git/npm 명령은 이 디렉터리에서 실행한다.

## 플로우

### 1. URL 받기
사용자가 아직 URL을 주지 않았으면 유튜브 영상 URL을 물어본다.
- 예: `https://www.youtube.com/watch?v=XXXX`, `https://youtu.be/XXXX`
- 이미 메시지에 URL이 있으면 그대로 사용한다.

### 2. videoId 추출
URL에서 11자 videoId를 뽑는다. 지원 형태: `watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`.

```bash
node -e 'const u=process.argv[1];const m=u.match(/(?:v=|youtu\.be\/|\/shorts\/|\/embed\/)([A-Za-z0-9_-]{11})/);console.log(m?m[1]:"PARSE_FAILED")' "<URL>"
```
`PARSE_FAILED` 가 나오면 URL을 다시 확인해 달라고 요청한다.

### 3. 메타정보(제목) 확인
oEmbed로 제목을 가져온다(가장 안정적, API 키 불필요). 설명은 og:description을 베스트에포트로 시도한다.

```bash
# 제목
curl -s "https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=<VIDEO_ID>" \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{console.log(JSON.parse(d).title)}catch{console.log("TITLE_FAILED")}})'

# 설명(선택, 실패해도 무방)
curl -sL "https://www.youtube.com/watch?v=<VIDEO_ID>" \
  | grep -oE '<meta property="og:description" content="[^"]*"' | head -1
```
- 제목이 `TITLE_FAILED` 이거나 비어 있으면 잘못된/비공개 영상일 수 있으니 사용자에게 알리고 중단한다.
- **가져온 제목(과 설명)을 사용자에게 보여주고, 이 영상이 맞는지 확인을 받는다.** 확인 전에는 절대 커밋하지 않는다.
- 설명을 못 가져왔으면 사용자에게 짧은 설명을 직접 넣을지, 비워둘지 물어본다. (홈 카드는 설명이 비어도 정상 렌더된다.)

### 4. featured.ts 수정
확인받은 값으로 `src/data/featured.ts` 의 `FEATURED_VIDEO` 세 필드를 교체한다.
제목/설명에 작은따옴표·큰따옴표가 섞여 있을 수 있으니 **백틱(template literal)** 으로 감싼다
(제목에 백틱이 들어있는 경우에만 예외적으로 이스케이프). 예:

```ts
export const FEATURED_VIDEO: Pick<Video, 'youtubeId' | 'title' | 'description'> = {
  youtubeId: `<VIDEO_ID>`,
  title: `<확인받은 제목>`,
  description: `<설명 또는 빈 문자열>`,
};
```
`import type { Video }` 줄과 주석은 그대로 둔다.

### 5. 빌드 · 커밋 · 푸시 · 배포
홈은 이 값을 빌드 타임에 import 하므로, **라이브 반영에는 gh-pages 배포까지 필요**하다
(main 푸시만으로는 라이브가 안 바뀐다). 순서대로 실행:

```bash
cd "C:/Users/inchun/OneDrive/Desktop/AI/watch-hive/watch-hive/my-react-app"
npm run build                       # tsc + vite, 타입/빌드 검증
git add src/data/featured.ts
git commit -m "chore(home): update featured video → <제목 요약>"
git pull --rebase origin main
git push origin main
npm run deploy                      # gh-pages 브랜치로 dist 배포
```
- `git push` 와 `npm run deploy` 가 인증 오류(`Password authentication is not supported`)를 내면,
  그 명령만 `dangerouslyDisableSandbox: true` 로 재시도한다(GCM 저장 자격증명 사용).
- 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` 를 붙인다.

### 6. 라이브 검증
배포 후 실제 사이트에 반영됐는지 확인하고 사용자에게 보고한다.

```bash
curl -sL "https://watch-hive.com/assets/" >/dev/null   # (참고용, 아래가 핵심)
# 홈 번들에 새 videoId가 들어갔는지 확인
curl -sL "https://watch-hive.com/" >/dev/null
```
가장 확실한 확인은 새 videoId 문자열이 배포된 JS 번들에 포함됐는지 보는 것이다.
필요하면 브라우저로 `https://watch-hive.com/` 홈 하단 추천 영상을 눈으로 확인한다.
CDN 반영에 30~60초 걸릴 수 있으니 바로 안 보이면 잠시 후 새로고침하라고 안내한다.

## 주의
- **Videos 탭 자동 목록(`videos.json`)은 건드리지 않는다.** 이 스킬은 홈 추천 영상 1개만 바꾼다.
- Shorts도 추천 영상으로 지정 가능하지만, 홈 카드는 16:9 임베드라 롱폼이 자연스럽다.
- 사용자 확인(3단계) 없이 커밋·배포하지 않는다.
