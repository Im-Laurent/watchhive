# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

---

# Vintage Maps (빈티지 시계점 지도)

`/vintage-maps` 는 한국·상하이·일본·홍콩의 빈티지 시계점을 Leaflet(OpenStreetMap) 지도에
플래그로 표시하고, 플래그를 누르면 Google Maps Embed 로 구글 장소 정보를 보여준다.
데이터는 내가 구글 맵에 저장해둔 장소(Takeout)를 어드민에서 큐레이션한 `public/places.json` 이다.

## 데이터 흐름

```
구글 Takeout(저장한 장소.json, GeoJSON)
   └─ node scripts/build-candidates.mjs → public/places.candidates.json (개발 전용, 배포 제외)
        └─ /admin (개발 전용) 에서 시계점 선택·보정 → Export → public/places.json (배포됨)
             └─ /vintage-maps 가 런타임에 읽어 지도에 표시
```

## 1) Takeout 내보내기 → 후보 생성

1. [Google Takeout](https://takeout.google.com) → **지도(내 장소) / 저장됨** 을 GeoJSON 으로 내보낸다.
   (시계 전용 저장 목록이 따로 있으면 그것만 내보내면 필터링이 거의 필요 없다.)
2. 후보 JSON 생성:

```bash
node scripts/build-candidates.mjs "<저장한 장소.json 경로>"
```

   - 인자 대신 `takeout/` 폴더(gitignore됨)에 `.json` 을 넣어두고 인자 없이 실행해도 된다.
   - 출력: `public/places.candidates.json` — **개발 서버에서만 서빙되고 커밋·배포되지 않는다**
     (`.gitignore` + `vite.config.ts` 의 `strip-dev-data` 플러그인이 dist 에서 제거).

## 2) 어드민에서 큐레이션 (`/admin`, 개발 전용)

```bash
npm run dev   # → http://localhost:3000/admin
```

- **어드민은 개발 빌드에만 존재한다.** `import.meta.env.DEV` 가 false 인 프로덕션에서는 라우트가
  등록되지 않아 번들에서 제거되고, 배포 사이트에서 `/admin` 은 404(NotFound)로 떨어진다.
- "시계 업종만" 필터로 후보를 좁히고, 노출할 시계점을 체크한다. 이름/지역/메모를 인라인 수정하고,
  **좌표 없는 항목(Takeout 한계)은 위도·경도를 직접 입력**하거나 제외한다.
- 편집 상태는 localStorage 에 저장된다. 기존 `public/places.json` 을 "가져오기"로 불러와 이어서 편집 가능.
- **Export places.json** → 받은 파일을 `public/places.json` 으로 교체 → 커밋.

## 3) 구글 장소 카드용 API 키 (선택)

플래그 클릭 시 뜨는 임베드 장소 카드는 **Google Maps Embed API**(무료·무제한)를 쓴다.
키가 없어도 지도와 "구글 지도에서 보기" 링크는 정상 동작하고, 임베드 카드만 표시되지 않는다.

발급/설정은 `.env.example` 참고. 키는 `.env.local` 에 `VITE_GMAPS_EMBED_KEY=...` 로 넣는다(gitignore됨).

## 4) 배포

```bash
npm run deploy   # predeploy 로 build 실행(env 키 인라인) → gh-pages → watch-hive.com
```

배포물에는 `public/places.json`(노출 대상)만 포함되고, 후보 데이터와 어드민 코드는 포함되지 않는다.
