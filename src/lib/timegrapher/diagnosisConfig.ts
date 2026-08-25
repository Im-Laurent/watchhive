// Cloudflare Worker URL과 Turnstile site key는 둘 다 클라이언트 번들에 노출되는 공개 값이라
// firebaseConfig(src/lib/firebase.ts)와 같은 방식으로 코드에 직접 둔다. 실제 비밀값(Turnstile
// secret key, Gemini API 키)은 이 값들과 달리 Worker의 `wrangler secret put`으로만 등록한다.
export const DIAGNOSIS_WORKER_URL = 'https://timegrapher-diagnosis.watch-hive-sub.workers.dev';
export const TURNSTILE_SITE_KEY = '0x4AAAAAAEbn85lPlVJ349IK';
