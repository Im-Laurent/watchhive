import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTickCapture } from '../hooks/useTickCapture';
import { useDiagnosis, type DiagnosisFailure } from '../hooks/useDiagnosis';
import { useCommunityStats } from '../hooks/useCommunityStats';
import { useClipboard } from '../hooks/useClipboard';
import { estimateBph, type BphEstimate } from '../lib/timegrapher/bphEstimator';
import { calculateRate, type RateEstimate } from '../lib/timegrapher/rateCalculator';
import { calculateBeatError, type BeatErrorEstimate } from '../lib/timegrapher/beatError';
import {
  DISCLAIMERS,
  GRADE_LABEL,
  lowConfidenceHint,
  REFERENCE_DISCLAIMER,
  REFERENCE_ROWS,
  judgeBeatError,
  judgeRate,
  type Grade,
} from '../lib/timegrapher/referenceRanges';
import RecommendedVideo from './RecommendedVideo';
import { setPullToRefreshLocked } from '../lib/pullToRefreshLock';

// 배지·버튼·결과 패널 색은 Year Finder / Fit Finder에서 쓰는 팔레트를 그대로 따른다.
const GRADE_STYLE: Record<Grade, string> = {
  excellent: 'text-green-600 bg-green-100',
  good: 'text-blue-500 bg-blue-100',
  caution: 'text-amber-600 bg-amber-100',
};

// 다른 도구 페이지의 주 버튼과 동일한 형태(gray-800 · rounded-full · py-3.5 · w-full).
const PRIMARY_BUTTON =
  'w-full bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3.5 px-4 rounded-full shadow-md transition';
const SECONDARY_BUTTON =
  'w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-4 rounded-full border-2 border-gray-300 transition';

/** 측정이 끝났는데도 값이 없으면 계속 "측정 중"으로 두지 않는다 — 끝났지만 못 구했다는 뜻이다. */
const MISSING_VALUE = (isDone: boolean) => (isDone ? '—' : '측정 중');

/** 측정값 카드 하나. 판정 배지는 값이 확정된 뒤에만 붙인다(측정 중에는 등급이 계속 흔들려 오히려 헷갈림). */
function MetricCard({
  label,
  value,
  unit,
  grade,
}: {
  label: string;
  value: string;
  unit?: string;
  grade?: Grade;
}) {
  return (
    <div className="bg-white rounded-xl p-1.5 sm:p-4 text-center shadow-sm">
      <p className="text-xs sm:text-sm text-gray-500 mb-1">{label}</p>
      {/* 좁은 폰에서 "-48.9s/d" 가 카드 밖으로 삐져나가던 자리다. 3단 그리드라 카드 하나가
          100px 남짓인데 단위까지 같은 크기로 붙으면 넘친다. 단위를 작게 떼고, 글자 크기를
          화면 폭에 맞춰 줄인다. */}
      <p className="font-bold text-blue-700 whitespace-nowrap tracking-tight text-[clamp(0.8rem,4.4vw,1.5rem)]">
        {value}
        {unit && <span className="ml-0.5 text-[0.62em] font-semibold">{unit}</span>}
      </p>
      {grade && (
        <span
          className={`inline-block mt-2 text-[11px] sm:text-xs font-bold tracking-wider rounded-full px-2 sm:px-3 py-0.5 sm:py-1 ${GRADE_STYLE[grade]}`}
        >
          {GRADE_LABEL[grade]}
        </span>
      )}
    </div>
  );
}

/**
 * 결과 화면 아래에 붙는 안내 섹션의 껍데기.
 *
 * "참고해 주세요"와 "읽어주세요"를 각각 따로 만들었더니 항목 카드 처리가 서로 달라졌다
 * (한쪽만 흰 카드). 같은 자리에 나란히 놓이는 블록이라 껍데기를 하나로 공유한다.
 */
function NoteSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 p-5 bg-gray-50 rounded-xl text-gray-700 text-left">
      <p className="font-bold text-lg mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/** 안내 섹션 안의 항목 하나 */
function NoteCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="font-bold text-gray-800 mb-2">{title}</p>
      {children}
    </div>
  );
}

/** 숫자만으로는 좋고 나쁨을 알 수 없으므로, 정비 기준과 빈티지에서 통용되는 기준을 나란히 보여준다. */
function ReferenceNote() {
  return (
    <NoteSection title="📊 참고해 주세요">
      {REFERENCE_ROWS.map((row) => (
        <NoteCard key={row.metric} title={row.metric}>
          <p className="text-sm text-gray-600 leading-relaxed mb-1">
            <span className="font-semibold text-gray-700">정비 기준</span> · {row.serviced}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-semibold text-gray-700">빈티지 허용</span> · {row.vintage}
          </p>
        </NoteCard>
      ))}
      <p className="text-sm text-gray-500 leading-relaxed">{REFERENCE_DISCLAIMER}</p>
    </NoteSection>
  );
}

/** 실패 원인마다 사용자가 할 수 있는 행동이 달라서 안내를 나눠 둔다. */
const DIAGNOSIS_FAILURE_MESSAGE: Record<DiagnosisFailure, string> = {
  config: '해석 기능이 아직 준비되지 않았어요. 조금 뒤에 다시 들러주세요.',
  verification:
    '자동 접속이 아닌지 확인하는 단계에서 막혔어요. 잠시 후 다시 눌러보시고, 계속 막히면 다른 브라우저에서 시도해 주세요.',
  timeout: '해석이 예상보다 오래 걸려서 중간에 멈췄어요. 잠시 후 다시 시도해 주세요.',
  server:
    '무료 서버를 쓰고 있어 트래픽이 몰리거나 한 사람이 여러 번 시도하는 경우 진단 결과 해석이 원활하지 않을 수 있어요ㅠㅠ 다음에 다시 시도해 주세요.',
};

/** 해석을 기다리는 동안 보여주는 진행 표시. 답변이 들어설 자리를 미리 잡아 화면이 덜 튀게 한다. */
function DiagnosisPending({ status }: { status: 'verifying' | 'requesting' }) {
  const [waitedLong, setWaitedLong] = useState(false);

  useEffect(() => {
    // 몇 초 넘게 걸리면 "멈춘 건가?" 싶어지므로, 그때부터 이유를 한 줄 덧붙인다.
    const id = setTimeout(() => setWaitedLong(true), 6000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      className="rounded-2xl border border-blue-200 bg-blue-50 p-5"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <svg
          className="tg-spin h-5 w-5 shrink-0 text-blue-500"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-base text-gray-700">
          {status === 'verifying' ? '접속을 확인하고 있어요…' : '측정값을 해석하고 있어요…'}
        </p>
      </div>

      <div className="tg-pulse mt-4 space-y-2.5" aria-hidden="true">
        <div className="h-3 rounded-full bg-blue-200" />
        <div className="h-3 rounded-full bg-blue-200" />
        <div className="h-3 w-2/3 rounded-full bg-blue-200" />
      </div>

      {waitedLong && (
        <p className="mt-4 text-sm text-gray-500 leading-relaxed">
          무료 서버를 쓰고 있어 조금 걸릴 수 있어요. 잠시만 기다려 주세요.
        </p>
      )}
    </div>
  );
}

/** 측정 완료 후 "결과 해석하기" 버튼/Turnstile 위젯/결과·실패 안내를 보여준다. */
function DiagnosisSection({ result }: { result: MeasurementResult }) {
  const diagnosis = useDiagnosis();
  const { bph } = result.bphEstimate;
  const { secondsPerDay } = result.rate;
  const { ms: beatErrorMs } = result.beatError;
  const canDiagnose = bph != null && secondsPerDay != null && beatErrorMs != null;

  return (
    <div className="mt-4 text-left">
      {/* Turnstile 위젯 컨테이너. appearance:'interaction-only'로 렌더하므로 평상시에는 성공/실패
          표시가 나타나지 않고, 사람 확인이 실제로 필요한 경우에만 위젯이 보인다. display:none으로
          숨기면 위젯 동작이 깨질 수 있어(공식 가이드) 요소 자체는 레이아웃에 남겨둔다. */}
      <div ref={diagnosis.widgetContainerRef} className="flex justify-center empty:hidden" />

      {/* 실패했을 때도 버튼을 남긴다. 없으면 다시 측정하지 않는 한 재시도할 방법이 없다. */}
      {(diagnosis.status === 'idle' || diagnosis.status === 'failed') && canDiagnose && (
        <button
          type="button"
          onClick={() => diagnosis.requestDiagnosis({ bph, rateSecondsPerDay: secondsPerDay, beatErrorMs })}
          className={diagnosis.status === 'failed' ? SECONDARY_BUTTON : PRIMARY_BUTTON}
        >
          {diagnosis.status === 'failed' ? '다시 해석하기' : '결과 해석하기'}
        </button>
      )}

      {(diagnosis.status === 'verifying' || diagnosis.status === 'requesting') && (
        <DiagnosisPending status={diagnosis.status} />
      )}

      {diagnosis.status === 'success' && diagnosis.comment && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-base text-gray-700 leading-relaxed">
          {diagnosis.comment}
        </div>
      )}

      {diagnosis.status === 'failed' && diagnosis.failure && (
        <p className="mt-3 text-sm text-gray-500 text-center leading-relaxed">
          {DIAGNOSIS_FAILURE_MESSAGE[diagnosis.failure]}
        </p>
      )}
    </div>
  );
}

/** 결과를 어디까지 믿어도 되는지 알려주는 고지. 숫자를 단정적으로 받아들이지 않도록 결과 아래에 둔다. */
function Disclaimers() {
  return (
    <NoteSection title="💡 읽어주세요">
      {DISCLAIMERS.map((item) => (
        <NoteCard key={item.title} title={item.title}>
          <p className="text-sm text-gray-600 leading-relaxed">{item.body}</p>
        </NoteCard>
      ))}
    </NoteSection>
  );
}

/** 결과 화면 하단의 좋아요·공유 버튼과 누적 카운트. Firestore를 못 읽는 상황에서는 숫자 없이 버튼만 보인다. */
function CommunitySection() {
  const { stats, liked, likeOnce, recordMeasurement, recordShare } = useCommunityStats();
  // useShare는 클립보드 복사에 더해 navigator.share(네이티브 공유창)까지 띄운다. 여기서는 복사만
  // 하고 안내 문구만 보여주기로 해서 useClipboard를 쓴다(다른 페이지의 안내 문구 표시 방식과 동일).
  const { copyToClipboard, copyMessage } = useClipboard();
  // 이미 좋아요를 누른 뒤에도 버튼이 반응은 해야 한다(예전엔 disabled라 hover도 클릭도 죽어서
  // 고장난 것처럼 보였다). 중복 집계는 막되, 왜 안 올라가는지 한 줄로 알려준다.
  const [likeNotice, setLikeNotice] = useState('');
  // 값을 바꿔 svg의 key를 갱신하면 요소가 새로 마운트되면서 CSS 애니메이션이 처음부터 다시 돈다.
  // (같은 클래스를 붙였다 떼는 방식은 연속 클릭 시 애니메이션이 재시작되지 않는다.)
  const [popKey, setPopKey] = useState(0);
  const recordedRef = useRef(false);

  const handleLike = useCallback(() => {
    setPopKey((n) => n + 1);
    if (liked) {
      setLikeNotice('이미 좋아요를 눌렀어요!');
      setTimeout(() => setLikeNotice(''), 3000);
      return;
    }
    likeOnce();
  }, [liked, likeOnce]);

  // 이 컴포넌트는 측정이 끝난 뒤에만 마운트되고 "다시 측정하기"를 누르면 언마운트되므로,
  // 마운트당 1회 기록이 곧 측정 1회가 된다. ref 가드는 StrictMode의 이중 실행만 막는 용도.
  useEffect(() => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    recordMeasurement();
  }, [recordMeasurement]);

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-full border-2 transition ${
            liked
              ? 'bg-red-50 hover:bg-red-100 text-red-500 border-red-200'
              : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
          }`}
        >
          <svg
            key={popKey}
            className={popKey > 0 ? 'tg-heart--pop' : undefined}
            width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          좋아요{stats ? ` ${stats.likes.toLocaleString()}` : ''}
        </button>
        <button
          type="button"
          onClick={() => {
            copyToClipboard(window.location.href, '링크가 클립보드에 복사되었어요!');
            recordShare();
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-full border-2 border-gray-300 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          공유하기{stats ? ` ${stats.shares.toLocaleString()}` : ''}
        </button>
      </div>

      {(copyMessage || likeNotice) && (
        <p className="text-sm text-blue-600 mt-3 text-center">{copyMessage || likeNotice}</p>
      )}
    </div>
  );
}

// 처음엔 오픈소스 vacaboja/tg의 "paperstrip"(점이 흩뿌려지는 방식)을 이식했지만, 실기기로 테스트해보니
// 폰 마이크의 tick당 타이밍 오차(~11ms)가 한 tick 단위로 보기엔 너무 커서 점들이 뭉치지 않고
// 흩어져 보였다. 사용자가 참고로 보여준 실제 Witschi 타임그래퍼 화면은 점이 아니라 부드럽게 이어지는
// 연속 곡선이었는데, 실제 녹음(론진 수동/까르띠에 자동)으로 확인해보니 그 이유를 알 수 있었다:
// tick 하나하나의 절대 타이밍은 노이즈가 크지만, 여러 tick을 이동평균으로 스무딩하면(약 2초 분량)
// 그 노이즈가 상쇄되고 실제로 의미 있는 완만한 추이(예: 손으로 든 폰이 미세하게 움직이며 생기는
// 편차 변화)가 매끄러운 곡선으로 드러난다 — Theil-Sen으로 이미 신뢰도를 검증한 Rate 계산과 같은
// "여러 tick을 통계적으로 합쳐 노이즈를 줄인다"는 원리를 시각화에도 적용한 것. BPH/Rate 등 실제
// 측정치 계산과는 분리된 시각화 전용 로직이라, 여기 정밀도가 떨어져도 결과 수치에는 영향이 없다.
const DISPLAY_WINDOW_SECONDS = 15; // 화면에 한 번에 보여주는 시간 폭(측정 구간과 동일)
const SMOOTHING_WINDOW_SECONDS = 2; // 이동평균 스무딩 폭 — 실제 녹음으로 비교해 선택
// 캔버스는 CSS 폭(모바일에서 ~370px)보다 크게 그려서 축소 렌더링으로 선을 또렷하게 만든다.
// 좌표는 전부 이 백업 스토어 픽셀 기준이라, 선 굵기도 그만큼 두껍게 잡아야 눈에 같은 굵기로 보인다.
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 560;
const GRID_LINE_WIDTH = 2;
const CURVE_LINE_WIDTH = 3;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Theil-Sen(모든 tick 쌍의 기울기 중앙값)으로 이론 간격 기준 기준선을 구하고, 각 tick이 그 기준선에서
 * 얼마나 벗어났는지(ms)를 계산한다. rateCalculator.ts와 같은 원리를 시각화용으로 재사용한다. */
function computeDeviationsMs(peaks: number[], bph: number): number[] {
  const theoretical = 3600 / bph;
  const first = peaks[0];
  const beatIndices = peaks.map((t) => Math.round((t - first) / theoretical));
  const slopes: number[] = [];
  for (let i = 0; i < peaks.length; i++) {
    for (let j = i + 1; j < peaks.length; j++) {
      const beatDelta = beatIndices[j] - beatIndices[i];
      if (beatDelta === 0) continue;
      slopes.push((peaks[j] - peaks[i]) / beatDelta);
    }
  }
  const fittedInterval = slopes.length > 0 ? median(slopes) : theoretical;
  return peaks.map((t, i) => (t - (first + beatIndices[i] * fittedInterval)) * 1000);
}

function useVibrographRenderer(
  active: boolean,
  peaksRef: ReturnType<typeof useTickCapture>['peaksRef'],
  bphRef: { current: number | null }
) {
  // canvas가 마운트되는 렌더와 status가 'active'로 바뀌는 렌더가 같은 커밋이 아닐 수 있어(측정
  // 시작 직후엔 아직 session.phase가 'warming'으로 안 바뀌어 캔버스가 DOM에 없는 순간이 있음),
  // 일반 useRef+useEffect 조합은 캔버스가 없는 시점에 한 번 실행되고 그걸로 끝나버려 이후 캔버스가
  // 마운트돼도 다시 시도하지 않는다. 콜백 ref로 실제 마운트 시점에 state를 갱신해 effect가 그때
  // 다시 실행되게 한다.
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useCallback((node: HTMLCanvasElement | null) => setCanvasEl(node), []);

  useEffect(() => {
    if (!active || !canvasEl) return;
    const canvas = canvasEl;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const draw = () => {
      const { width, height: plotHeight } = canvas;
      ctx.clearRect(0, 0, width, plotHeight);
      ctx.fillStyle = '#0a1e5c';
      ctx.fillRect(0, 0, width, plotHeight);

      const allPeaks = peaksRef.current;
      const bph = bphRef.current;

      if (allPeaks.length >= 8 && bph) {
        const latest = allPeaks[allPeaks.length - 1];
        const windowStart = latest - DISPLAY_WINDOW_SECONDS;
        // 스무딩 윈도우가 화면 왼쪽 끝에서도 온전히 계산되도록, 화면 밖의 과거 데이터도 여유분만큼 포함
        const peaks = allPeaks.filter((t) => t > windowStart - SMOOTHING_WINDOW_SECONDS);

        if (peaks.length >= 8) {
          const deviations = computeDeviationsMs(peaks, bph);
          const smoothed = peaks.map((t) => {
            let sum = 0;
            let count = 0;
            for (let j = 0; j < peaks.length; j++) {
              if (Math.abs(peaks[j] - t) <= SMOOTHING_WINDOW_SECONDS / 2) {
                sum += deviations[j];
                count++;
              }
            }
            return sum / count;
          });

          const visible = peaks.map((t, i) => ({ t, y: smoothed[i] })).filter((p) => p.t > windowStart);

          if (visible.length >= 2) {
            const grid = '#ffffff26';
            ctx.strokeStyle = grid;
            ctx.lineWidth = GRID_LINE_WIDTH;
            for (let gx = 0; gx <= 12; gx++) {
              const x = (gx / 12) * width;
              ctx.beginPath();
              ctx.moveTo(x + 0.5, 0);
              ctx.lineTo(x + 0.5, plotHeight);
              ctx.stroke();
            }
            for (let gy = 0; gy <= 6; gy++) {
              const y = (gy / 6) * plotHeight;
              ctx.beginPath();
              ctx.moveTo(0, y + 0.5);
              ctx.lineTo(width, y + 0.5);
              ctx.stroke();
            }

            const ys = visible.map((p) => p.y);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            const pad = Math.max(5, (maxY - minY) * 0.2);
            const rangeMin = minY - pad;
            const rangeMax = maxY + pad;

            const toX = (t: number) => ((t - windowStart) / DISPLAY_WINDOW_SECONDS) * width;
            const toY = (y: number) => plotHeight - ((y - rangeMin) / (rangeMax - rangeMin)) * plotHeight;

            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.moveTo(0, toY(0));
            ctx.lineTo(width, toY(0));
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = CURVE_LINE_WIDTH;
            ctx.beginPath();
            visible.forEach((p, i) => {
              const x = toX(p.t);
              const y = toY(p.y);
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    };
    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [active, canvasEl, peaksRef, bphRef]);

  // canvasEl 도 함께 돌려준다 — 콜백 ref 라 호출부에서 .current 로 엘리먼트를 집을 수 없다.
  return { canvasRef, canvasEl };
}

/** 측정 시작 전 안내: 폰의 어느 부분(마이크)을 시계 어디에 대야 하는지 보여주는 그림 가이드. */
function PlacementGuide() {
  return (
    <div className="flex flex-col items-center mb-2">
      <div className="mb-6">
        <p className="text-xl font-bold text-gray-800">폰으로 간편한 시계 상태 진단</p>
        <p className="text-sm text-gray-500 mt-1.5">설치 없이, 광고 없이, 무료로 제공합니다</p>
      </div>
      {/* 잘린 폰 윗부분은 위로 갈수록 흐려지며 투명하게 사라지도록 원본에 그라데이션을 구워 넣었다.
          알파가 있는 선화라 webp가 png보다 4배 작다 — png는 webp를 못 읽는 구형 브라우저용 폴백. */}
      <picture>
        <source type="image/webp" srcSet="/images/timegrapher_guide.webp" />
        <img
          src="/images/timegrapher_guide.png"
          alt="폰 아래쪽 마이크를 시계 쪽으로 향하게 두는 모습"
          width={480}
          height={932}
          className="w-40 sm:w-44 h-auto mb-5"
        />
      </picture>
      <div className="text-base text-gray-600 space-y-2 text-left max-w-md">
        <p>① 시계 태엽을 충분히 감아주세요</p>
        <p>② 조용한 곳에서 시계를 평평한 곳에 놓아주세요</p>
        <p>③ 폰 아래쪽(마이크)을 시계에 최대한 가까이 대주세요</p>
      </div>
      {/* 이 문구는 아래 "측정 시작" 버튼으로 이어지는 말이라, 위는 넓게 띄우고 버튼과는 붙여 둔다. */}
      <div className="text-sm text-gray-500 space-y-0.5 mt-8">
        <p>측정에는 약 {MEASURE_SECONDS}초가 걸려요</p>
        <p>준비가 되었다면</p>
      </div>
    </div>
  );
}

type MeasurementResult = {
  bphEstimate: BphEstimate;
  rate: RateEstimate;
  beatError: BeatErrorEstimate;
};

const EMPTY_RESULT: MeasurementResult = {
  bphEstimate: { bph: null, rawIntervalSeconds: null, confidence: 'low' },
  rate: { secondsPerDay: null, sampleCount: 0, jitterMs: null, confidence: 'low' },
  beatError: { ms: null, sampleCount: 0, droppedRatio: null, confidence: 'low' },
};

function computeFromPeaks(peaks: number[]): MeasurementResult {
  const bphEstimate = estimateBph(peaks);
  return {
    bphEstimate,
    rate: calculateRate(peaks, bphEstimate.bph),
    beatError: calculateBeatError(peaks),
  };
}

function recentWindow(peaks: number[], windowSeconds: number): number[] {
  if (peaks.length === 0) return [];
  const latest = peaks[peaks.length - 1];
  return peaks.filter((t) => t > latest - windowSeconds);
}

// aubio의 onset detector는 시작 직후 몇 초간 내부 적응형 임계값이 아직 안정되지 않아 이 구간의
// tick 타이밍이 상대적으로 부정확하다 — 이 구간은 화면에 보여주지 않고 버린다.
const WARMUP_SECONDS = 3;
// 워밍업 이후 이 정도만 깨끗하게 측정해도 가장 느린 표준 BPH(12000)에서조차 tick이 40개 이상
// 쌓여 통계적으로 안정된 값을 낼 수 있다.
const MEASURE_SECONDS = 15;
/** 다시 측정할 때 그래프를 화면 위로 올리며 남기는 여백 */
const GRAPH_SCROLL_MARGIN_PX = 16;

type Phase = 'idle' | 'warming' | 'measuring' | 'stopped' | 'done';

/**
 * 측정 세션의 진행 상태(준비 중 → 측정 중 → 완료)를 관리한다.
 * 계속 실시간으로 값을 갱신하며 "언제 안정됐는지" 사용자가 알 수 없게 하는 대신,
 * 워밍업 구간은 버리고 정해진 시간만 측정한 뒤 하나의 확정된 결과로 제시한다.
 */
function useMeasurementSession(
  status: ReturnType<typeof useTickCapture>['status'],
  peaksRef: ReturnType<typeof useTickCapture>['peaksRef'],
  stopCapture: () => void
) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState<MeasurementResult>(EMPTY_RESULT);
  const [finalResult, setFinalResult] = useState<MeasurementResult | null>(null);

  useEffect(() => {
    // status가 'active'가 아니게 되는 경우(사용자가 직접 정지했거나, 측정 완료 후 자동 정지된 경우)엔
    // 아무 것도 초기화하지 않는다 — 그래야 측정 완료 후 결과 화면이 그대로 유지된다.
    if (status !== 'active') return;

    setPhase('warming');
    setElapsed(0);
    setFinalResult(null);
    // 이전 측정의 수치가 live에 남아 있으면, 아직 새 값이 없는 워밍업 3초 동안 옛 값이 그대로
    // 보인다. 새 측정을 시작하는 순간 화면의 숫자도 "측정 중"으로 되돌린다.
    setLive(EMPTY_RESULT);
    const startedAt = Date.now();

    const id = setInterval(() => {
      const secondsElapsed = (Date.now() - startedAt) / 1000;
      setElapsed(secondsElapsed);

      if (secondsElapsed < WARMUP_SECONDS) {
        return;
      }

      if (secondsElapsed < WARMUP_SECONDS + MEASURE_SECONDS) {
        setPhase('measuring');
        setLive(computeFromPeaks(recentWindow(peaksRef.current, MEASURE_SECONDS)));
        return;
      }

      setPhase('done');
      setFinalResult(computeFromPeaks(recentWindow(peaksRef.current, MEASURE_SECONDS)));
      clearInterval(id);
      stopCapture();
    }, 500);

    return () => clearInterval(id);
  }, [status, peaksRef, stopCapture]);

  // 사용자가 직접 멈춘 경우는 'idle'로 되돌리지 않고 'stopped'로 둔다 — 그래야 그때까지 그린
  // 그래프가 남고, 버튼도 "측정 시작"이 아니라 "다시 측정하기"로 보인다.
  const cancel = useCallback(() => setPhase('stopped'), []);

  return { phase, elapsed, live, finalResult, cancel };
}

export default function TimegrapherTool() {
  const { status, error, peaksRef, start, stop } = useTickCapture();
  const session = useMeasurementSession(status, peaksRef, stop);

  const result = session.phase === 'done' ? session.finalResult : session.live;

  // 애니메이션 루프(useVibrographRenderer)가 리렌더 없이 최신 bph를 읽을 수 있도록 ref로 전달
  const bphRef = useRef<number | null>(null);
  bphRef.current = result?.bphEstimate.bph ?? null;

  const { canvasRef, canvasEl } = useVibrographRenderer(status === 'active', peaksRef, bphRef);

  const handleManualStop = () => {
    session.cancel();
    stop();
  };

  /**
   * 결과·중단 화면에서 "다시 측정하기"는 결과 패널·해석·안내를 지나 한참 아래에 있다.
   * 그대로 다시 시작하면 정작 봐야 할 그래프와 남은 시간이 화면 밖에 있으므로 위로 끌어올린다.
   */
  const handleRestart = useCallback(() => {
    start();
    if (!canvasEl) return;
    const top = canvasEl.getBoundingClientRect().top + window.scrollY - GRAPH_SCROLL_MARGIN_PX;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [start, canvasEl]);

  const { copyToClipboard: copyLinkToClipboard, copyMessage: linkCopyMessage } = useClipboard();
  const copyLink = useCallback(
    () => copyLinkToClipboard(window.location.href, '링크가 클립보드에 복사되었어요!'),
    [copyLinkToClipboard]
  );

  const showCapturing = session.phase === 'warming' || session.phase === 'measuring';

  // 측정 중에 화면을 잘못 건드려 새로고침되면 15초짜리 측정이 통째로 날아간다.
  useEffect(() => {
    setPullToRefreshLocked(showCapturing);
    return () => setPullToRefreshLocked(false);
  }, [showCapturing]);
  const isDone = session.phase === 'done';
  const isStopped = session.phase === 'stopped';
  const measureProgress = Math.max(0, Math.min(MEASURE_SECONDS, Math.floor(session.elapsed - WARMUP_SECONDS)));

  // 소음 때문에 흔들린 지표를 모은다. 값이 아예 안 나온 경우(null)가 가장 나쁜 경우이므로
  // 함께 넣는다 — 그러지 않으면 소음이 심할수록 오히려 경고가 사라지는 꼴이 된다.
  const shakyMetrics = [
    result?.bphEstimate.bph == null || result.bphEstimate.confidence === 'low' ? '진동수' : null,
    result?.rate.secondsPerDay == null || result.rate.confidence === 'low' ? '일오차' : null,
    result?.beatError.ms == null || result.beatError.confidence === 'low' ? '비트에러' : null,
  ].filter((m): m is string => m !== null);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8 text-center">
      {status === 'error' && (
        <p className="text-red-700 text-sm leading-relaxed bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
          {error ?? '마이크를 열지 못했어요.'}
        </p>
      )}
      {/* 에러 상태에서도 안내 그림은 계속 보여준다 — 사용자가 다시 시도할 때 필요한 정보라서. */}
      {(status === 'idle' || status === 'error') && !isDone && !isStopped && <PlacementGuide />}
      {status === 'requesting' && <p className="text-base text-gray-500">마이크 권한을 요청하고 있어요…</p>}

      {(showCapturing || isStopped || isDone) && (
        <>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full rounded-lg" />
          {/* 캔버스 안에 그리면 축소 렌더링 때문에 뭉개져서 안 읽힌다 — HTML 텍스트로 뺐다. */}
          <p className="text-xs text-gray-400 mt-1.5 mb-4">기준선 대비 편차 추이(평균값)</p>

          {session.phase === 'warming' && <p className="text-base text-gray-500 mb-4">준비 중이에요…</p>}
          {session.phase === 'measuring' && (
            <div className="mb-4">
              {/* 폰을 시계에 댄 채로 화면을 곁눈질하는 상황이라, 남은 시간은 멀리서도 읽히게 크게 센다. */}
              <p className="text-4xl font-bold text-gray-800 tabular-nums leading-none mb-3">
                {MEASURE_SECONDS - measureProgress}
                <span className="text-xl font-semibold text-gray-500 ml-1">초</span>
              </p>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded-full transition-[width] duration-500 ease-linear"
                  style={{ width: `${(measureProgress / MEASURE_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          )}
          {isStopped && <p className="text-base text-gray-500 mb-4">측정을 중단했어요</p>}
          {isDone && (
            <p className="mb-4 inline-flex items-center justify-center gap-1.5 text-xs font-bold tracking-wider text-green-600 bg-green-100 rounded-full px-3 py-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              측정 완료
            </p>
          )}

          {/* Fit Finder / Year Finder의 결과 패널과 같은 형태. 확정된 결과일 때만 파란 강조를 준다. */}
          <div
            className={`rounded-2xl border p-4 sm:p-6 ${
              isDone ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}
          >
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <MetricCard label="진동수" value={result?.bphEstimate.bph?.toLocaleString() ?? MISSING_VALUE(isDone)} />
            <MetricCard
              label="일오차"
              value={
                result?.rate.secondsPerDay != null
                  ? `${result.rate.secondsPerDay > 0 ? '+' : ''}${result.rate.secondsPerDay.toFixed(1)}`
                  : MISSING_VALUE(isDone)
              }
              unit={result?.rate.secondsPerDay != null ? 's/d' : undefined}
              grade={isDone && result?.rate.secondsPerDay != null ? judgeRate(result.rate.secondsPerDay) : undefined}
            />
            <MetricCard
              label="비트에러"
              value={result?.beatError.ms != null ? result.beatError.ms.toFixed(1) : MISSING_VALUE(isDone)}
              unit={result?.beatError.ms != null ? 'ms' : undefined}
              grade={isDone && result?.beatError.ms != null ? judgeBeatError(result.beatError.ms) : undefined}
            />
          </div>
          </div>

          {isDone && shakyMetrics.length > 0 && (
            <p className="mt-4 text-left text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 leading-relaxed">
              {lowConfidenceHint(shakyMetrics)}
            </p>
          )}

          {/* 버튼은 다음 행동 순서대로 묶어둔다: 결과 해석 → 다시 측정 → 좋아요·공유. */}
          {isDone && result && <DiagnosisSection result={result} />}

          {isDone && (
            <button
              type="button"
              onClick={handleRestart}
              className={`mt-3 ${SECONDARY_BUTTON}`}
            >
              다시 측정하기
            </button>
          )}

          {isDone && <CommunitySection />}

          {isDone && <ReferenceNote />}
          {isDone && <Disclaimers />}
          {isDone && <RecommendedVideo />}
        </>
      )}

      {showCapturing && (
        <button
          type="button"
          onClick={handleManualStop}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-gray-100 font-bold py-3.5 px-4 rounded-full shadow-md transition"
        >
          측정 중단
        </button>
      )}

      {isStopped && (
        <button
          type="button"
          onClick={handleRestart}
          className={`mt-6 ${PRIMARY_BUTTON}`}
        >
          다시 측정하기
        </button>
      )}

      {!showCapturing && !isStopped && !isDone && (
        <button
          type="button"
          onClick={start}
          disabled={status === 'requesting'}
          className={`mt-3 ${PRIMARY_BUTTON} disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          측정 시작
        </button>
      )}

      {/* 마이크가 없거나 권한을 주기 어려운 PC에서 들어온 사람을 폰으로 넘겨주기 위한 경로. */}
      {!showCapturing && !isStopped && !isDone && (
        <>
          <button type="button" onClick={copyLink} className={`mt-3 ${SECONDARY_BUTTON}`}>
            링크 복사
          </button>
          <p className="mt-3 text-sm text-gray-500 leading-relaxed">
            PC에서 접속하셨다면 링크 복사 후 스마트폰 브라우저로 진행해 주세요
          </p>
          {linkCopyMessage && <p className="mt-2 text-sm text-blue-600">{linkCopyMessage}</p>}
        </>
      )}
    </div>
  );
}
