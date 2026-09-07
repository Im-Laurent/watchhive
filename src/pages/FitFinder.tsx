import { useState, useRef } from 'react';
import PageHead from '../components/PageHead';
import { PAGE_META } from '../data/pageMeta';
import PageHero from '../components/PageHero';
import SubscribeShare from '../components/SubscribeShare';
import { computeFit, MAX_WRIST, MIN_WRIST, type FitRecommendation, type WatchType } from '../data/fitSizing';

type Result = FitRecommendation & { wrist: number; type: WatchType };

const WATCH_TYPES: { value: WatchType; title: string; desc: string }[] = [
  { value: 'dress-watch', title: '드레스 워치', desc: '손목에 아름답게 감기는 클래식한 비율' },
  { value: 'tool-watch', title: '툴 워치', desc: '존재감 있는 스포티한 볼륨감' },
  { value: 'generous-fit', title: '빅 사이즈', desc: '큰 시계를 좋아하는 사람을 위한 핏' },
];
const TYPE_LABEL: Record<WatchType, string> = {
  'dress-watch': '드레스 워치',
  'tool-watch': '툴 워치',
  'generous-fit': '빅 사이즈',
};

const DEFAULT_WRIST = 55;

const clamp = (v: number) => Math.max(MIN_WRIST, Math.min(MAX_WRIST, v));

/**
 * 손목 단면(막대)과 추천 케이스(원)의 폭을 나란히 놓고 비교하는 그림.
 *
 * 막대 폭이 손목 너비, 원 지름이 케이스 크기다 — 그래서 비율이 1에 가까울수록 원이 막대만큼
 * 커진다. 예전에는 viewBox 높이가 150 뿐이라 지름 182짜리 원(70%)이 아래로 잘려 반원처럼
 * 보였고, 원을 글자보다 나중에 그려서 "손목 단면 55mm" 를 통째로 덮었다.
 * 비율이 최대(1.0)여도 원이 온전히 들어가도록 높이를 잡고, 글자는 원 바깥 위아래에 둔다.
 */
const BAR_LEFT = 30;
const BAR_W = 260;
const BAR_H = 26;
const VIEW_W = 320;
const CX = VIEW_W / 2;
/** 비율 1.0 일 때의 반지름 — 원이 막대와 같은 폭이 된다 */
const MAX_R = BAR_W / 2;
/** 원과 글자 사이에 남겨 둘 여백 */
const LABEL_GAP = 22;
const CENTER_Y = LABEL_GAP + MAX_R;
const VIEW_H = CENTER_Y + MAX_R + LABEL_GAP;
const CASE_LABEL_Y = 16;
const WRIST_LABEL_Y = VIEW_H - 6;

export default function FitFinder() {
  const [watchType, setWatchType] = useState<WatchType>('dress-watch');
  const [wrist, setWrist] = useState(DEFAULT_WRIST);
  // 입력칸에 보이는 글자는 확정값과 따로 둔다. 한 글자마다 40~65 로 붙이면 칸을 비우고
  // "50" 을 칠 때 5 → 40 → "400" → 65 로 끝나서 두 자리 수를 손으로 넣을 수 없었다.
  // 치는 동안에는 글자를 그대로 두고, 온전한 값이 되면 그때 확정한다.
  const [wristText, setWristText] = useState(String(DEFAULT_WRIST));
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const runCalc = (type: WatchType, value: number, scroll = false) => {
    const c = computeFit(type, value);
    setResult({ ...c, type, wrist: value });
    if (scroll) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const selectType = (type: WatchType) => {
    setWatchType(type);
    if (result) runCalc(type, wrist);
  };

  /** 확정값을 바꾸고, 이미 결과가 떠 있으면 함께 갱신한다. */
  const commitWrist = (value: number) => {
    setWrist(value);
    setWristText(String(value));
    if (result) runCalc(watchType, value);
  };

  /** 슬라이더는 언제나 범위 안의 값만 주므로 그대로 확정한다. */
  const changeWrist = (value: number) => {
    if (Number.isFinite(value)) commitWrist(clamp(value));
  };

  /** 직접 입력칸: 치는 도중에는 글자만 두고, 범위 안의 값이 되면 확정한다. */
  const typeWrist = (text: string) => {
    setWristText(text);
    const parsed = Number.parseInt(text, 10);
    if (Number.isFinite(parsed) && parsed >= MIN_WRIST && parsed <= MAX_WRIST) {
      setWrist(parsed);
      if (result) runCalc(watchType, parsed);
    }
  };

  /** 칸을 벗어날 때 비었거나 범위 밖이면 그때 정리한다 — 치는 중에 끼어들지 않는다. */
  const settleWrist = () => {
    const parsed = Number.parseInt(wristText, 10);
    commitWrist(Number.isFinite(parsed) ? clamp(parsed) : wrist);
  };

  // 케이스가 손목보다 클 수는 없으므로 1 에서 자른다 — 원이 막대를 넘어서면 비교가 깨진다.
  const ratio = result ? Math.min(1, result.caseMax / result.wrist) : 0;
  const caseR = (BAR_W * ratio) / 2;
  const pct = Math.round(ratio * 100);

  return (
    <>
      <PageHead {...PAGE_META.fitFinder} />
      <PageHero
        title="Fit Finder"
        subtitle="손목에 가장 조화로운 케이스·러그 사이즈를 찾아보세요"
        imgBase="fit_finder_hero"
        alt="가죽 위에 나란히 놓인 빈티지 시계 여섯 점 — 케이스 크기와 형태가 저마다 다르다"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8">
          {/* Step 1: watch type cards */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-sm font-bold">1</span>
              <span className="text-lg font-bold text-gray-800">시계 종류 선택</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {WATCH_TYPES.map((t) => {
                const on = watchType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => selectType(t.value)}
                    className={`text-left p-4 rounded-xl border-2 transition ${
                      on ? 'border-gray-800 bg-gray-50 ring-2 ring-gray-800' : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-bold text-gray-800 mb-1">{t.title}</p>
                    <p className="text-sm text-gray-500 leading-snug">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: wrist input */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-sm font-bold">2</span>
              <span className="text-lg font-bold text-gray-800">손목 단면 너비</span>
            </div>
            <div className="flex items-end justify-between mb-3">
              <span className="text-sm text-gray-400">{MIN_WRIST}mm</span>
              <div className="text-center">
                <span className="text-4xl font-bold text-gray-800">{wrist}</span>
                <span className="text-xl font-semibold text-gray-500">mm</span>
              </div>
              <span className="text-sm text-gray-400">{MAX_WRIST}mm</span>
            </div>
            <input
              type="range"
              min={MIN_WRIST}
              max={MAX_WRIST}
              step={1}
              value={wrist}
              onChange={(e) => changeWrist(Number.parseInt(e.target.value, 10))}
              className="fit-slider w-full mb-4"
            />
            <div className="flex items-center gap-2 justify-center">
              <span className="text-sm text-gray-500">직접 입력</span>
              <input
                type="number"
                min={MIN_WRIST}
                max={MAX_WRIST}
                value={wristText}
                onChange={(e) => typeWrist(e.target.value)}
                onBlur={settleWrist}
                className="w-24 text-center border rounded-lg py-2 px-3 text-base"
              />
              <span className="text-sm text-gray-500">mm</span>
            </div>
          </div>

          <button
            onClick={() => runCalc(watchType, wrist, true)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3.5 px-4 rounded-full shadow-md w-full transition"
          >
            추천 사이즈 확인
          </button>

          {/* Result */}
          {result && (
            <div ref={resultRef} className="mt-8">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <div className="flex items-center justify-center gap-2 mb-5">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-100 rounded-full px-3 py-1">
                    {TYPE_LABEL[result.type]}
                  </span>
                </div>

                {/* Wrist diagram */}
                <div className="flex flex-col items-center mb-6">
                  <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full max-w-xs">
                    <rect
                      x={BAR_LEFT}
                      y={CENTER_Y - BAR_H / 2}
                      width={BAR_W}
                      height={BAR_H}
                      rx={BAR_H / 2}
                      fill="#d1d5db"
                    />
                    <circle cx={CX} cy={CENTER_Y} r={caseR} fill="#3b82f6" fillOpacity="0.85" />
                    <circle cx={CX} cy={CENTER_Y} r={caseR} fill="none" stroke="#1d4ed8" strokeWidth="2" />
                    {/* 글자는 맨 나중에 — 앞서 그리면 원이 그 위를 덮는다 */}
                    <text x={CX} y={CASE_LABEL_Y} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d4ed8">
                      케이스 {result.caseMax.toFixed(1)}mm · {pct}%
                    </text>
                    <text x={CX} y={WRIST_LABEL_Y} textAnchor="middle" fontSize="12" fill="#6b7280">
                      손목 단면 {result.wrist}mm
                    </text>
                  </svg>
                  <p className="text-xs text-gray-400 mt-1">손목 단면 대비 추천 케이스 비율(최대값 기준)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">추천 케이스 사이즈 <span className="text-gray-400">(용두 제외)</span></p>
                    <p className="text-2xl font-bold text-blue-700">{result.recCase}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">최대 러그 투 러그 길이</p>
                    <p className="text-2xl font-bold text-blue-700">{result.recLug}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Measurement guide (collapsible) */}
          <details className="mt-6 group">
            <summary className="cursor-pointer list-none flex items-center justify-between p-4 bg-gray-50 rounded-xl text-gray-700 font-semibold">
              <span>| 손목 단면 측정 방법</span>
              <span className="transition-transform group-open:rotate-180">▾</span>
            </summary>
            <div className="p-4">
              <ul className="list-none p-0 m-0 text-gray-600 text-base mb-4 space-y-1">
                <li>1. 손목 단면 너비</li>
                <li>2. 케이스 사이즈</li>
                <li>3. 러그 투 러그 사이즈</li>
              </ul>
              <div className="flex justify-center">
                <img src="/images/fit_finder_guide.png" alt="측정 가이드" className="max-w-full h-auto rounded-lg shadow-sm" />
              </div>
            </div>
          </details>

          {/* Tips */}
          <div className="mt-6 p-5 bg-gray-50 rounded-xl text-gray-700">
            <p className="font-bold text-lg mb-3">| 참고해주세요!</p>
            <ul className="space-y-2 text-base">
              <li>– 손목 단면 너비는 손목 뼈에서 1.0~1.5cm 왼쪽을 측정하세요. (왼손 기준)</li>
              <li>– 세로로 긴 직사각형, 타원형 시계의 경우 추천 케이스 사이즈는 세로를 기준으로 참고하세요.</li>
              <li>– 바둑알 간지를 원하시면 추천 케이스 사이즈의 최소값에 도전해 보세요.</li>
              <li>– 손목 너비 5cm인 저는 27~32mm 빈티지를 즐겨 차며, 최대 사이즈는 34mm로 하고 있습니다.</li>
              <li>– 파네라이는 방간 맛으로 차는 시계니까 추천 사이즈와 무관하게 호신용으로 좋아보이는걸 선택하세요.</li>
            </ul>
          </div>
        </div>

        <SubscribeShare shareTitle="Fit Finder" shareText="나에게 맞는 시계 사이즈를 찾아보세요!" />
      </main>
    </>
  );
}
