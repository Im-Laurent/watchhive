import { useCallback, useRef, useState } from 'react';
import { DIAGNOSIS_WORKER_URL, TURNSTILE_SITE_KEY } from '../lib/timegrapher/diagnosisConfig';

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback': () => void;
  // 'interaction-only': 실제로 사람 확인이 필요한 경우에만 위젯이 보인다. 평상시엔 성공/실패
  // 표시가 전혀 노출되지 않는다. display:none으로 숨기면 위젯 동작이 깨질 수 있어 이 옵션을 쓴다.
  appearance?: 'always' | 'execute' | 'interaction-only';
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

export type DiagnosisStatus = 'idle' | 'verifying' | 'requesting' | 'success' | 'failed';

export type DiagnosisInput = {
  bph: number;
  rateSecondsPerDay: number;
  beatErrorMs: number;
};

// 모델 응답은 실측 약 1.8초지만 모바일 네트워크 왕복과 변동을 감안해 여유를 둔다.
// 워커 쪽 타임아웃(12초)보다 길게 잡아, 지연 시 워커의 502 응답이 도착할 여지를 남긴다.
const REQUEST_TIMEOUT_MS = 15000;
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('turnstile script load failed')));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('turnstile script load failed'));
    document.head.appendChild(script);
  });
}

/**
 * "진단 결과 해석하기" 버튼 클릭 시에만 동작하는 명시적 트리거. Turnstile(비대화형)로 토큰을 받아
 * Worker에 짧은 타임아웃(8초)으로 1회만 요청하고, 실패해도 자동 재시도하지 않는다 — 재시도하려면
 * 사용자가 버튼을 다시 눌러야 하므로 그 자체가 반복 공격에 대한 자연스러운 비용이 된다.
 */
export function useDiagnosis() {
  const [status, setStatus] = useState<DiagnosisStatus>('idle');
  const [comment, setComment] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);

  const requestDiagnosis = useCallback(async (input: DiagnosisInput) => {
    if (!DIAGNOSIS_WORKER_URL || !TURNSTILE_SITE_KEY) {
      setStatus('failed');
      return;
    }

    setStatus('verifying');
    setComment(null);

    try {
      await loadTurnstileScript();
      const container = widgetContainerRef.current;
      if (!container || !window.turnstile) throw new Error('turnstile unavailable');
      container.innerHTML = '';

      const token = await new Promise<string>((resolve, reject) => {
        window.turnstile!.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          callback: resolve,
          'error-callback': () => reject(new Error('turnstile verification error')),
        });
      });

      setStatus('requesting');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(DIAGNOSIS_WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ turnstileToken: token, ...input }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }
      if (!res.ok) throw new Error(`worker responded ${res.status}`);

      const data = (await res.json()) as { comment?: unknown };
      if (typeof data.comment !== 'string' || data.comment.length === 0) {
        throw new Error('malformed diagnosis response');
      }
      setComment(data.comment);
      setStatus('success');
    } catch {
      setStatus('failed');
    }
  }, []);

  return { status, comment, requestDiagnosis, widgetContainerRef };
}
