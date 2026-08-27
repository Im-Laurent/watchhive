import { useCallback, useRef, useState } from 'react';
import { DIAGNOSIS_WORKER_URL, TURNSTILE_SITE_KEY } from '../lib/timegrapher/diagnosisConfig';

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  // 실패 코드가 인자로 들어온다(예: 600010 = 챌린지 실행 실패). 원인을 좁히려면 이 값이 필요하다.
  'error-callback': (code?: string) => void;
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

/**
 * 실패를 한 덩어리로 묶으면 사람 확인에서 막힌 건지, 모델이 느린 건지, 서버가 죽은 건지
 * 화면만 보고는 구분할 수 없다. 사용자에게 다른 안내를 주고 원인도 좁힐 수 있게 나눠 둔다.
 */
export type DiagnosisFailure = 'config' | 'verification' | 'timeout' | 'server';

export type DiagnosisInput = {
  bph: number;
  rateSecondsPerDay: number;
  beatErrorMs: number;
};

// 모델 응답은 실측 약 1.8초지만 모바일 네트워크 왕복과 변동을 감안해 여유를 둔다.
// 워커 쪽 타임아웃(20초)보다 길게 잡아, 지연 시 워커의 502 응답이 도착할 여지를 남긴다.
const REQUEST_TIMEOUT_MS = 24000;
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
 * "결과 해석하기" 버튼 클릭 시에만 동작하는 명시적 트리거. Turnstile(비대화형)로 토큰을 받아
 * Worker에 1회만 요청하고, 실패해도 자동 재시도하지 않는다 — 재시도하려면 사용자가 버튼을
 * 다시 눌러야 하므로 그 자체가 반복 공격에 대한 자연스러운 비용이 된다.
 */
export function useDiagnosis() {
  const [status, setStatus] = useState<DiagnosisStatus>('idle');
  const [failure, setFailure] = useState<DiagnosisFailure | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement | null>(null);

  const requestDiagnosis = useCallback(async (input: DiagnosisInput) => {
    if (!DIAGNOSIS_WORKER_URL || !TURNSTILE_SITE_KEY) {
      setFailure('config');
      setStatus('failed');
      return;
    }

    setStatus('verifying');
    setComment(null);
    setFailure(null);

    let token: string;
    try {
      await loadTurnstileScript();
      const container = widgetContainerRef.current;
      if (!container || !window.turnstile) throw new Error('turnstile unavailable');
      container.innerHTML = '';

      token = await new Promise<string>((resolve, reject) => {
        window.turnstile!.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          callback: resolve,
          'error-callback': (code) => reject(new Error(`turnstile error ${code ?? '(코드 없음)'}`)),
        });
      });
    } catch (err) {
      // 어떤 코드로 막혔는지 콘솔에 남겨둔다 — 사용자가 알려줄 때 원인을 좁히는 유일한 단서다.
      console.error('[timegrapher] 사람 확인 단계 실패:', err);
      setFailure('verification');
      setStatus('failed');
      return;
    }

    setStatus('requesting');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(DIAGNOSIS_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turnstileToken: token, ...input }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`worker responded ${res.status}`);

      const data = (await res.json()) as { comment?: unknown };
      if (typeof data.comment !== 'string' || data.comment.length === 0) {
        throw new Error('malformed diagnosis response');
      }
      setComment(data.comment);
      setStatus('success');
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      console.error('[timegrapher] 해석 요청 실패:', err);
      setFailure(aborted ? 'timeout' : 'server');
      setStatus('failed');
    } finally {
      clearTimeout(timeoutId);
    }
  }, []);

  return { status, failure, comment, requestDiagnosis, widgetContainerRef };
}
