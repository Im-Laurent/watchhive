import { useCallback, useEffect, useRef, useState } from 'react';
import { useTickCapture } from '../hooks/useTickCapture';
import { useDiagnosis } from '../hooks/useDiagnosis';
import { useCommunityStats } from '../hooks/useCommunityStats';
import { useShare } from '../hooks/useShare';
import { estimateBph, type BphEstimate } from '../lib/timegrapher/bphEstimator';
import { calculateRate, type RateEstimate } from '../lib/timegrapher/rateCalculator';
import { calculateBeatError, type BeatErrorEstimate } from '../lib/timegrapher/beatError';
import {
  GRADE_LABEL,
  LOW_CONFIDENCE_HINT,
  MEASUREMENT_CAVEAT,
  REFERENCE_DISCLAIMER,
  REFERENCE_ROWS,
  judgeBeatError,
  judgeRate,
  type Grade,
} from '../lib/timegrapher/referenceRanges';
import RecommendedVideo from './RecommendedVideo';

const GRADE_STYLE: Record<Grade, string> = {
  excellent: 'text-green-700 bg-green-50',
  good: 'text-blue-700 bg-blue-50',
  caution: 'text-amber-700 bg-amber-50',
};

/** 측정값 카드 하나. 판정 배지는 값이 확정된 뒤에만 붙인다(측정 중에는 등급이 계속 흔들려 오히려 헷갈림). */
function MetricCard({ label, value, grade }: { label: string; value: string; grade?: Grade }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
      {grade && (
        <span className={`inline-block mt-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${GRADE_STYLE[grade]}`}>
          {GRADE_LABEL[grade]}
        </span>
      )}
    </div>
  );
}

/** 숫자만으로는 좋고 나쁨을 알 수 없으므로, 정비 기준과 빈티지에서 통용되는 기준을 나란히 펼쳐 보여준다. */
function ReferenceNote() {
  return (
    <details className="mt-4 text-left group">
      <summary className="cursor-pointer list-none flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700">
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          className="transition-transform group-open:rotate-90"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
        이 숫자, 어느 정도면 정상인가요?
      </summary>

      <div className="mt-3 space-y-2">
        {REFERENCE_ROWS.map((row) => (
          <div key={row.metric} className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-bold text-gray-700 mb-2">{row.metric}</p>
            <p className="text-xs text-gray-500 leading-relaxed mb-1">
              <span className="font-semibold text-gray-600">정비 기준</span> · {row.serviced}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-600">빈티지 허용</span> · {row.vintage}
            </p>
          </div>
        ))}
        <p className="text-[11px] text-gray-400 leading-relaxed">{REFERENCE_DISCLAIMER}</p>
      </div>
    </details>
  );
}

/** 측정 완료 후 "진단 결과 해석하기" 버튼/Turnstile 위젯/결과·실패 안내를 보여준다. */
function DiagnosisSection({ result }: { result: MeasurementResult }) {
  const diagnosis = useDiagnosis();
  const { bph } = result.bphEstimate;
  const { secondsPerDay } = result.rate;
  const { ms: beatErrorMs } = result.beatError;
  const canDiagnose = bph != null && secondsPerDay != null && beatErrorMs != null;

  return (
    <div className="mt-6 text-left">
      {/* Turnstile 위젯 컨테이너. appearance:'interaction-only'로 렌더하므로 평상시에는 성공/실패
          표시가 나타나지 않고, 사람 확인이 실제로 필요한 경우에만 위젯이 보인다. display:none으로
          숨기면 위젯 동작이 깨질 수 있어(공식 가이드) 요소 자체는 레이아웃에 남겨둔다. */}
      <div ref={diagnosis.widgetContainerRef} className="flex justify-center empty:hidden" />

      {diagnosis.status === 'idle' && canDiagnose && (
        <button
          type="button"
          onClick={() => diagnosis.requestDiagnosis({ bph, rateSecondsPerDay: secondsPerDay, beatErrorMs })}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold py-3 rounded-xl transition"
        >
          진단 결과 해석하기
        </button>
      )}

      {(diagnosis.status === 'verifying' || diagnosis.status === 'requesting') && (
        <p className="text-sm text-gray-400 text-center py-3">해석 중이에요…</p>
      )}

      {diagnosis.status === 'success' && diagnosis.comment && (
        <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">{diagnosis.comment}</div>
      )}

      {diagnosis.status === 'failed' && (
        <p className="text-xs text-gray-400 text-center py-3">
          무료 서버를 쓰고 있어 트래픽이 몰리거나 한 사람이 여러 번 시도하는 경우 진단 결과 해석이 원활하지 않을 수
          있어요ㅠㅠ 다음에 다시 시도해 주세요.
        </p>
      )}
    </div>
  );
}

/** 결과 화면 하단의 좋아요·공유 버튼과 누적 카운트. Firestore를 못 읽는 상황에서는 숫자 없이 버튼만 보인다. */
function CommunitySection() {
  const { stats, liked, likeOnce, recordMeasurement, recordShare } = useCommunityStats();
  const { handleShare, shareMessage } = useShare('Timegrapher', '내 시계 상태를 소리로 진단해보세요!');
  const recordedRef = useRef(false);

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
          onClick={likeOnce}
          disabled={liked}
          className={`flex-1 flex items-center justify-center gap-1.5 font-semibold py-3 rounded-xl transition ${
            liked ? 'bg-red-50 text-red-500 cursor-default' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          좋아요{stats ? ` ${stats.likes.toLocaleString()}` : ''}
        </button>
        <button
          type="button"
          onClick={() => {
            void handleShare();
            recordShare();
          }}
          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          공유하기{stats ? ` ${stats.shares.toLocaleString()}` : ''}
        </button>
      </div>

      {shareMessage && <p className="text-xs text-green-600 mt-2 text-center">{shareMessage}</p>}
      {stats && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          지금까지 {stats.measurements.toLocaleString()}번 측정됐어요
        </p>
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

  return canvasRef;
}

/** 측정 시작 전 안내: 폰의 어느 부분(마이크)을 시계 어디에 대야 하는지 보여주는 그림 가이드. */
function PlacementGuide() {
  return (
    <div className="flex flex-col items-center gap-4 mb-6">
      <svg width="140" height="192" viewBox="0 0 140 192" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        {/* 시계 */}
        <circle cx="70" cy="152" r="34" fill="#f3f4f6" stroke="#9ca3af" strokeWidth="2" />
        <circle cx="70" cy="152" r="2.5" fill="#4b5563" />
        <line x1="70" y1="152" x2="70" y2="134" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
        <line x1="70" y1="152" x2="82" y2="152" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" />
        <rect x="65" y="115" width="10" height="6" rx="2" fill="#9ca3af" />

        {/* 폰 (하단이 시계면을 향함) */}
        <rect x="46" y="14" width="48" height="88" rx="10" fill="#1f2937" />
        <rect x="50" y="18" width="40" height="80" rx="6" fill="#374151" />
        {/* 마이크 위치 표시 */}
        <circle cx="70" cy="94" r="3" fill="#f97316" />

        {/* 화살표: 마이크 → 시계면. 화살촉이 시계 케이스에 닿지 않게 여백을 둔다. */}
        <line x1="70" y1="104" x2="70" y2="112" stroke="#f97316" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M70 114 L66 108 M70 114 L74 108" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="text-sm text-gray-500 space-y-1.5 text-left max-w-md">
        <p>① 시계 태엽을 충분히 감아주세요</p>
        <p>② 조용한 곳에서 시계를 평평한 곳에 놓아주세요</p>
        <p>③ 폰 아래쪽(마이크)을 시계 뒷면에 가까이 대주세요</p>
      </div>
      <p className="text-xs text-gray-400">측정에는 약 {WARMUP_SECONDS + MEASURE_SECONDS}초가 걸려요</p>
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
  rate: { secondsPerDay: null, sampleCount: 0 },
  beatError: { ms: null, sampleCount: 0 },
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

type Phase = 'idle' | 'warming' | 'measuring' | 'done';

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

  const cancel = useCallback(() => setPhase('idle'), []);

  return { phase, elapsed, live, finalResult, cancel };
}

export default function TimegrapherTool() {
  const { status, error, peaksRef, start, stop } = useTickCapture();
  const session = useMeasurementSession(status, peaksRef, stop);

  const result = session.phase === 'done' ? session.finalResult : session.live;

  // 애니메이션 루프(useVibrographRenderer)가 리렌더 없이 최신 bph를 읽을 수 있도록 ref로 전달
  const bphRef = useRef<number | null>(null);
  bphRef.current = result?.bphEstimate.bph ?? null;

  const canvasRef = useVibrographRenderer(status === 'active', peaksRef, bphRef);

  const handleManualStop = () => {
    session.cancel();
    stop();
  };

  const showCapturing = session.phase === 'warming' || session.phase === 'measuring';
  const isDone = session.phase === 'done';
  const measureProgress = Math.max(0, Math.min(MEASURE_SECONDS, Math.floor(session.elapsed - WARMUP_SECONDS)));

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8 text-center">
      {status === 'error' && (
        <p className="text-red-700 text-sm leading-relaxed bg-red-50 rounded-xl p-3 mb-6 text-left">
          {error ?? '마이크를 열지 못했어요.'}
        </p>
      )}
      {/* 에러 상태에서도 안내 그림은 계속 보여준다 — 사용자가 다시 시도할 때 필요한 정보라서. */}
      {(status === 'idle' || status === 'error') && !isDone && <PlacementGuide />}
      {status === 'requesting' && <p className="text-gray-500">마이크 권한을 요청하고 있어요…</p>}

      {(showCapturing || isDone) && (
        <>
          <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full rounded-lg" />
          {/* 캔버스 안에 그리면 축소 렌더링 때문에 뭉개져서 안 읽힌다 — HTML 텍스트로 뺐다. */}
          <p className="text-[11px] text-gray-400 mt-1.5 mb-4">기준선 대비 편차 추이 (ms, 부드럽게 평균낸 값)</p>

          {session.phase === 'warming' && <p className="text-sm text-gray-500 mb-4">준비 중이에요…</p>}
          {session.phase === 'measuring' && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                측정 중이에요… {measureProgress}/{MEASURE_SECONDS}초
              </p>
              {/* 남은 시간이 눈에 보여야 폰을 계속 대고 있어야 한다는 걸 알 수 있다. */}
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-800 rounded-full transition-[width] duration-500 ease-linear"
                  style={{ width: `${(measureProgress / MEASURE_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          )}
          {isDone && (
            <p className="text-sm font-semibold text-green-600 mb-4 flex items-center justify-center gap-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              측정 완료
            </p>
          )}

          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="BPH" value={result?.bphEstimate.bph?.toLocaleString() ?? '측정 중'} />
            <MetricCard
              label="Rate"
              value={
                result?.rate.secondsPerDay != null
                  ? `${result.rate.secondsPerDay > 0 ? '+' : ''}${result.rate.secondsPerDay.toFixed(1)}s/d`
                  : '측정 중'
              }
              grade={isDone && result?.rate.secondsPerDay != null ? judgeRate(result.rate.secondsPerDay) : undefined}
            />
            <MetricCard
              label="Beat Error"
              value={result?.beatError.ms != null ? `${result.beatError.ms.toFixed(1)}ms` : '측정 중'}
              grade={isDone && result?.beatError.ms != null ? judgeBeatError(result.beatError.ms) : undefined}
            />
          </div>

          {isDone && result?.bphEstimate.confidence === 'low' && (
            <p className="mt-4 text-left text-xs text-amber-700 bg-amber-50 rounded-xl p-3 leading-relaxed">
              {LOW_CONFIDENCE_HINT}
            </p>
          )}

          {isDone && <ReferenceNote />}

          {isDone && result && <DiagnosisSection result={result} />}

          {isDone && (
            <p className="mt-6 text-left text-[11px] text-gray-400 leading-relaxed">{MEASUREMENT_CAVEAT}</p>
          )}

          {isDone && <CommunitySection />}
          {isDone && <RecommendedVideo />}
        </>
      )}

      {showCapturing ? (
        <button
          type="button"
          onClick={handleManualStop}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-8 rounded-full shadow-md transition"
        >
          측정 정지
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          disabled={status === 'requesting'}
          className="mt-6 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 px-8 rounded-full shadow-md transition"
        >
          {isDone ? '다시 측정하기' : '측정 시작'}
        </button>
      )}
    </div>
  );
}
