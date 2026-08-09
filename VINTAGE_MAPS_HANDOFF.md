# Vintage Maps — 진행 상황 & 재개 핸드오프

> **상태: 구현 완료 · 검증 통과 · 배포 전 일시정지 (PAUSED)**
> 로컬에서 완전히 동작하며 `tsc`/`oxlint`/`vite build` 모두 통과. **아직 배포하지 않음.**
> 아래 "미결정 사항 2건"을 사용자가 검토한 뒤 진행 여부를 결정한다.
> 최종 업데이트: 2026-08-08

---

## 1. 지금 무엇이 되어 있나 (구현된 스펙)

`/vintage-maps` — 한국·상하이·일본·홍콩의 빈티지 시계점을 지도에 **플래그**로 표시하고, 플래그를
누르면 **구글 장소 카드(Google Maps Embed)** 가 열린다. 데이터는 사용자가 구글 맵에 저장해둔
장소(Takeout)를 **개발 전용 어드민(`/admin`)** 에서 큐레이션한 `public/places.json`.

- **베이스 지도:** Leaflet + 무료 타일 (Google 결제 불필요). 커스텀 SVG 플래그 마커.
- **지역별 언어 규칙 (현재 확정):**
  | 지역 | 지도 라벨 | 구글 장소 카드 |
  |---|---|---|
  | **한국** | 한국어 (OSM 표준 타일) | 한국어 (`language=ko&region=KR`) |
  | **상하이·일본·홍콩** | 영어 (CARTO Voyager 타일) | 영어 (`language=en`) |
  - 지역 탭 전환 시 **타일 레이어 자체가 교체**된다. (`src/pages/VintageMaps.tsx`의 `tileFor()`)
- **장소 카드:** Google Maps **Embed API**(무료·무제한). 키 없으면 지도·"구글 지도에서 보기"
  링크는 동작하고 임베드 카드만 미표시. 키는 `.env.local`의 `VITE_GMAPS_EMBED_KEY`.
- **어드민 `/admin` — 개발 전용 (일반 사용자 미노출):**
  - `import.meta.env.DEV`일 때만 라우트 등록 → 프로덕션 번들에서 제거됨(배포 사이트에서 `/admin`은
    404). 검증: `dist/`에 어드민 코드/후보 데이터 없음 확인 완료.
  - 기능: 시계 업종 필터·지역 필터·검색·"좌표 없음만" 필터, 노출 체크박스, 이름/지역/메모 인라인
    편집, **좌표 없는 항목 위경도 직접 입력**, localStorage 자동 저장, 기존 places.json 가져오기,
    **Export places.json** 다운로드.

## 2. 데이터 파이프라인 (2단계)

```
구글 Takeout(저장한 장소.json, GeoJSON)
  └─ node scripts/build-candidates.mjs "<경로>"  → public/places.candidates.json (개발전용·배포제외)
       └─ /admin 에서 시계점 선택·보정 → Export → public/places.json (배포됨, 지도가 읽는 최종본)
```
- 후보 JSON은 `.gitignore` + `vite.config.ts`의 `strip-dev-data` 플러그인으로 **커밋·배포되지 않음**.
- Takeout 파서(`scripts/build-candidates.mjs`)는: `[경도,위도]` 순서 처리, `[0,0]`은 좌표없음
  처리, `?cid=`/`ftid` 16진수→CID 추출, 위치정보 없으면 `?q=`에서 주소 복원, 지역 자동 분류
  (좌표 바운딩박스 + country_code + 텍스트), 시계 업종 추정(키워드).

## 3. 파일 목록

**신규**
- `scripts/build-candidates.mjs` — Takeout GeoJSON → 후보 JSON 변환기.
- `src/pages/VintageMaps.tsx` — 지도 페이지(지역 탭·플래그·정보패널·지역별 타일/카드 언어).
- `src/pages/PlacesAdmin.tsx` — 어드민 큐레이션 툴(개발 전용).
- `src/hooks/usePlaces.ts` — `public/places.json` 런타임 로더(+fallback). `useVideos.ts` 미러.
- `src/data/places.fallback.ts` — fetch 실패 시 시드(현재 Shanghai Watches 1곳).
- `public/places.json` — 최종 노출 데이터(현재 시드 1곳; 어드민 Export로 교체).
- `public/places.candidates.json` — 후보 풀(gitignore, 스크립트 생성).
- `.env.example` — `VITE_GMAPS_EMBED_KEY` 발급/설정 가이드.
- `mockups/vintage-maps-preview.html` — 배포 전 확인용 화면 목업(두 화면 탭 전환, 실제 구현과 동일).

**수정**
- `src/data/types.ts` — `Region`, `WatchPlace`, `PlacesPayload`, `PlaceCandidate`, `CandidatesPayload`.
- `src/App.tsx` — `/vintage-maps` 라우트 + `import.meta.env.DEV` 조건부 `/admin`(lazy).
- `src/components/Layout.tsx` — `NAV`에 Vintage Maps 추가(어드민은 미추가).
- `vite.config.ts` — `strip-dev-data` 플러그인(후보 데이터 dist에서 제거).
- `.gitignore` — `takeout/`, `public/places.candidates.json`.
- `package.json` — `leaflet`, `@types/leaflet` 추가.
- `README.md` — "Vintage Maps" 섹션(사용법·API키·배포).

## 4. 실행 / 재개 방법

```bash
cd my-react-app
npm install                                   # leaflet 등 설치(이미 되어 있으면 생략)
node scripts/build-candidates.mjs "<저장한 장소.json 경로>"   # 후보 생성
npm run dev                                    # http://localhost:3000/vintage-maps , /admin
```
- 원본 Takeout 위치(이번 세션 기준):
  `C:\Users\inchun\OneDrive\Desktop\takeout-20260806T135258Z-1-001\Takeout\지도(내 장소)\저장한 장소.json`
- 어드민에서 큐레이션 → Export → 받은 파일을 `public/places.json`로 교체 → 커밋 → `npm run deploy`.
- 구글 카드 키(선택): `.env.local`에 `VITE_GMAPS_EMBED_KEY=...` (`.env.example` 참고).

## 5. ⛳ 진행 전 미결정 사항 (사용자 검토 대기)

1. **구글 지도 유료(JS API) 전환 여부**
   - 현재: 무료(Leaflet + OSM/CARTO 타일). 장점: 결제 불필요. 한계: 상하이·일본 일부 소지명이
     100% 영어가 아닐 수 있음(무료 타일 한계).
   - 유료(Google Maps JavaScript API): 모든 라벨 완전 영어/다국어 확실 + 더 리치한 장소 UI. 단
     **Google Cloud 결제 계정 필요**(월 무료 크레딧 있음).
   - **결정 시 영향:** 유료로 가면 `VintageMaps.tsx`의 Leaflet 타일 부분을 Google JS 지도로 교체
     (마커/정보창도 Google로). 어드민·데이터 파이프라인은 그대로 재사용 가능.

2. **Takeout DB가 부분적인 문제**
   - 현재 내보낸 파일은 **상하이 5곳뿐**이고, 그중 **3곳은 좌표·이름이 없음**(구글이 위치정보를
     제거한 항목 — `"이 저장된 장소에 위치 정보가 없습니다"`). 한국·일본·홍콩 데이터는 **없음**.
   - 선택지: (a) 더 완전한 Takeout 재내보내기(시계 전용 저장목록을 만들어 내보내면 최선),
     (b) 어드민에서 좌표를 직접 입력해 보정, (c) 진행 보류.
   - 파서·어드민은 좌표 없는 항목도 이미 처리(어드민에서 위경도 입력란 제공)하므로, DB만 채워지면
     바로 지도에 반영됨.

## 6. 검증 상태 (이번 세션 통과 항목)

- `npx tsc -b` → 0 에러 · `npm run lint`(oxlint) → 통과 · `npm run build` → 성공.
- 브라우저 확인: 네비/모바일/푸터에 Vintage Maps 노출, 상하이 탭에 Shanghai Watches 플래그·목록·
  정보패널 정상, 어드민 후보 5곳 로드·필터·좌표입력·Export 동작, 콘솔 에러 없음.
- **어드민 배포 차단 검증:** 프로덕션 `dist/` 번들에 어드민 코드/후보 데이터 없음 확인.

## 7. 아직 안 한 것

- 실제 시계점 큐레이션(전 지역), 구글 Embed 키 발급, 더 큰 Takeout 반영, **프론트 배포**.
- (미결정 1·2 확정 후 진행)
