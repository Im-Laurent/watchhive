export interface Env {
  ALLOWED_ORIGINS: string;
  MODEL_NAME: string;
  TURNSTILE_SECRET_KEY: string;
  GEMINI_API_KEY: string;
}

type DiagnosisRequest = {
  turnstileToken: string;
  bph: number;
  rateSecondsPerDay: number;
  beatErrorMs: number;
};

// 모델 응답은 실측 약 1.8초. 클라이언트 타임아웃(useDiagnosis.ts의 24초)보다 짧게 유지해서,
// 지연 시 워커가 먼저 정리되고 클라이언트는 안내 문구를 띄울 502를 받도록 한다.
// 12초에서 늘렸다 — 느려도 결국 도착하는 응답을 끊어버리는 것보다, 진행 표시를 띄운 채
// 기다렸다가 받는 편이 낫다.
const MODEL_TIMEOUT_MS = 20000;

function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (origin && allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

function isValidBody(body: unknown): body is DiagnosisRequest {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.turnstileToken === 'string' &&
    b.turnstileToken.length > 0 &&
    typeof b.bph === 'number' &&
    Number.isFinite(b.bph) &&
    b.bph >= 10000 &&
    b.bph <= 50000 &&
    typeof b.rateSecondsPerDay === 'number' &&
    Number.isFinite(b.rateSecondsPerDay) &&
    Math.abs(b.rateSecondsPerDay) <= 5000 &&
    typeof b.beatErrorMs === 'number' &&
    Number.isFinite(b.beatErrorMs) &&
    b.beatErrorMs >= 0 &&
    b.beatErrorMs <= 100
  );
}

async function verifyTurnstile(token: string, secretKey: string, remoteIp: string | null): Promise<boolean> {
  // multipart/form-data(FormData)로 보냈더니 siteverify가 HTTP 400으로 거부했다.
  // 문서에 명시된 JSON 형식으로 보낸다. remoteip는 선택 항목이라 값이 있을 때만 포함한다.
  const payload: Record<string, string> = { secret: secretKey, response: token };
  if (remoteIp) payload.remoteip = remoteIp;

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '<본문 읽기 실패>');
    console.error(`siteverify HTTP ${res.status}: ${detail.slice(0, 300)}`);
    return false;
  }
  // 실패 사유는 error-codes에만 담겨 온다(예: invalid-input-secret = 시크릿 키가 잘못됨,
  // timeout-or-duplicate = 토큰 만료/재사용). 이게 없으면 실패해도 원인을 알 수 없다.
  const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] };
  if (data.success !== true) {
    console.error(`turnstile 실패: ${JSON.stringify(data['error-codes'] ?? [])}`);
    return false;
  }
  return true;
}

/**
 * 프롬프트로 금지해도 모델이 가끔 "안녕하세요!"로 문을 연다. 그럴 때만 첫 인사를 걷어낸다.
 *
 * 일부러 좁게 잡았다. 처음엔 "첫 문장부호까지 통째로" 잘랐더니
 * "안녕하세요라는 인사 없이 바로 설명합니다."의 첫 문장을 통째로 먹었다. 그래서
 * (1) 인사말 바로 뒤에 한글이 붙으면 인사가 아니라고 보고,
 * (2) 한글을 만나기 전에 문장부호로 끝나는 '단독 절'일 때만 제거한다.
 * 애매하면 그냥 두는 쪽을 택한다 — 본문을 깎아먹는 것보다 인사가 남는 편이 낫다.
 */
function stripGreeting(text: string): string {
  const stripped = text.replace(/^\s*(안녕하세요|안녕하십니까|반갑습니다)(?![가-힣])[^가-힣\n]*?[.!?~]+\s*/, '').trim();
  return stripped.length > 0 ? stripped : text;
}

function buildPrompt(input: DiagnosisRequest): string {
  return `당신은 취미로 기계식 시계를 조정하는 사람들에게 친절하게 설명해주는 도우미입니다.
아래는 스마트폰 마이크로 측정한 타임그래퍼 측정값입니다.

- BPH(시간당 진동수): ${input.bph}
- 일차(Rate): ${input.rateSecondsPerDay.toFixed(1)}초/일
- Beat Error: ${input.beatErrorMs.toFixed(2)}ms

참고로 정비된 시계 기준으로는 대략 일차 ±10초/일 이내, Beat Error 0.5ms 이내면 우수한 편으로 봅니다.
이 수치를 바탕으로 현재 상태를 한국어 2~4문장으로 설명해주세요. 다음 규칙을 반드시 지키세요:
- "안녕하세요" 같은 인사말이나 서두 없이, 첫 문장부터 곧바로 측정 결과 설명으로 시작하세요.
- 확정적인 고장 진단이나 특정 부품 교체를 권유하지 마세요.
- 스마트폰 마이크 측정은 참고용이며 오차가 있을 수 있다는 점을 자연스럽게 포함하세요.
- 전문 용어는 최소화하고 일반인이 이해하기 쉽게 설명하세요.
- 과도하게 걱정을 주거나 반대로 과도하게 안심시키지 마세요.`;
}

async function generateComment(prompt: string, env: Env): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.MODEL_NAME}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
            // 이 기능에는 추론 과정이 필요 없고, 켜두면 응답이 수십 초로 늘어난다(실측: Gemma 4는
            // 사고 과정 때문에 22~26초, 이 설정을 끈 Gemini 3.5 Flash는 1.8초).
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
        signal: controller.signal,
      }
    );
    if (!res.ok) {
      // 실패 원인(모델명 오류/키 문제/쿼터 초과 등)은 응답 본문에만 담겨 오므로 로그로 남긴다.
      // API 키 자체는 요청 헤더에만 있고 응답 본문에는 포함되지 않아 로그에 노출되지 않는다.
      const detail = await res.text().catch(() => '<본문 읽기 실패>');
      console.error(`model ${res.status} (${env.MODEL_NAME}): ${detail.slice(0, 500)}`);
      throw new Error(`model ${res.status}`);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
    };
    // 추론형 모델은 사고 과정을 thought:true인 part로 함께 돌려주므로, 그걸 답변으로 착각하지
    // 않도록 걸러낸다(thinkingBudget을 0으로 둬도 방어적으로 유지).
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => p.thought !== true)
      .map((p) => p.text ?? '')
      .join('')
      .trim();
    if (!text) {
      console.error(`model empty response: ${JSON.stringify(data).slice(0, 500)}`);
      throw new Error('model empty response');
    }
    return stripGreeting(text);
  } finally {
    clearTimeout(timeoutId);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin');
    const headers = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (!headers['Access-Control-Allow-Origin']) {
      return jsonResponse({ error: 'origin not allowed' }, 403, headers);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method not allowed' }, 405, headers);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid json' }, 400, headers);
    }

    if (!isValidBody(body)) {
      return jsonResponse({ error: 'invalid measurement values' }, 400, headers);
    }

    const remoteIp = request.headers.get('CF-Connecting-IP');
    const verified = await verifyTurnstile(body.turnstileToken, env.TURNSTILE_SECRET_KEY, remoteIp);
    if (!verified) {
      return jsonResponse({ error: 'turnstile verification failed' }, 403, headers);
    }

    try {
      const comment = await generateComment(buildPrompt(body), env);
      return jsonResponse({ comment }, 200, headers);
    } catch (err) {
      console.error('diagnosis failed:', err instanceof Error ? err.message : String(err));
      return jsonResponse({ error: 'diagnosis generation failed' }, 502, headers);
    }
  },
};
