import { useState, useRef } from 'react';
import PageHead from '../components/PageHead';
import { useShare } from '../hooks/useShare';
import { SIZE_CHART } from '../data/sizeChart';
import PageHero from '../components/PageHero';

type WatchType = 'dress-watch' | 'tool-watch' | 'generous-fit';
type Result = { recCase: string; recLug: string; caseMax: number; wrist: number; type: WatchType };

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

const MIN_WRIST = 40;
const MAX_WRIST = 65;

function compute(type: WatchType, value: number): Omit<Result, 'type' | 'wrist'> {
  if (type === 'dress-watch') {
    return {
      recCase: `${(value * 0.6).toFixed(1)}mm ~ ${(value * 0.7).toFixed(1)}mm`,
      recLug: `${(value * 0.85).toFixed(1)}mm`,
      caseMax: value * 0.7,
    };
  }
  if (type === 'generous-fit') {
    return {
      recCase: `${(value * 0.75).toFixed(1)}mm ~ ${(value * 0.8).toFixed(1)}mm`,
      recLug: `${(value * 0.9).toFixed(1)}mm`,
      caseMax: value * 0.8,
    };
  }
  const data = SIZE_CHART.find((r) => r.crossSection === Math.round(value)) || SIZE_CHART[0];
  const maxC = parseFloat(data.caseSizes[1]);
  return {
    recCase: `${(maxC - 2).toFixed(1)}mm ~ ${maxC.toFixed(1)}mm`,
    recLug: `${(parseFloat(data.maxLugToLug) - 1).toFixed(1)}mm`,
    caseMax: maxC,
  };
}

export default function FitFinder() {
  const [watchType, setWatchType] = useState<WatchType>('dress-watch');
  const [wrist, setWrist] = useState(55);
  const [result, setResult] = useState<Result | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { handleShare, shareMessage } = useShare('Fit Finder', '나에게 맞는 시계 사이즈를 찾아보세요!');

  const clamp = (v: number) => Math.max(MIN_WRIST, Math.min(MAX_WRIST, v));

  const runCalc = (type: WatchType, value: number, scroll = false) => {
    const c = compute(type, value);
    setResult({ ...c, type, wrist: value });
    if (scroll) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const selectType = (type: WatchType) => {
    setWatchType(type);
    if (result) runCalc(type, wrist);
  };

  const changeWrist = (value: number) => {
    const v = clamp(value);
    setWrist(v);
    if (result) runCalc(watchType, v);
  };

  // wrist diagram geometry
  const barLeft = 30;
  const barRight = 290;
  const barW = barRight - barLeft;
  const barY = 95;
  const barH = 26;
  const ratio = result ? Math.min(1, result.caseMax / result.wrist) : 0;
  const caseD = barW * ratio;
  const cx = 160;
  const pct = Math.round(ratio * 100);

  return (
    <>
      <PageHead
        title="Fit Finder"
        description="손목 단면 너비로 나에게 어울리는 시계 케이스·러그 사이즈를 계산합니다."
        path="/fit-finder"
      />
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
              onChange={(e) => changeWrist(parseInt(e.target.value))}
              className="fit-slider w-full mb-4"
            />
            <div className="flex items-center gap-2 justify-center">
              <span className="text-sm text-gray-500">직접 입력</span>
              <input
                type="number"
                min={MIN_WRIST}
                max={MAX_WRIST}
                value={wrist}
                onChange={(e) => changeWrist(parseInt(e.target.value))}
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
                  <svg viewBox="0 0 320 150" className="w-full max-w-xs">
                    <rect x={barLeft} y={barY} width={barW} height={barH} rx={13} fill="#d1d5db" />
                    <text x={cx} y={barY + barH + 18} textAnchor="middle" fontSize="12" fill="#6b7280">
                      손목 단면 {result.wrist}mm
                    </text>
                    <circle cx={cx} cy={barY + barH / 2} r={caseD / 2} fill="#3b82f6" fillOpacity="0.85" />
                    <circle cx={cx} cy={barY + barH / 2} r={caseD / 2} fill="none" stroke="#1d4ed8" strokeWidth="2" />
                    <text x={cx} y={barY - 14} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1d4ed8">
                      케이스 {result.caseMax.toFixed(1)}mm · {pct}%
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
              <span>📐 손목 단면 측정 방법</span>
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
            <p className="font-bold text-lg mb-3">💡 참고해주세요!</p>
            <ul className="space-y-2 text-base">
              <li>✋ 손목 단면 너비는 손목 뼈에서 1.0~1.5cm 왼쪽을 측정하세요. (왼손 기준)</li>
              <li>📏 세로로 긴 직사각형, 타원형 시계의 경우 추천 케이스 사이즈는 세로를 기준으로 참고하세요.</li>
              <li>🎲 바둑알 간지를 원하시면 추천 케이스 사이즈의 최소값에 도전해 보세요.</li>
              <li>🙋‍♂️ 손목 너비 5cm인 저는 27~32mm 빈티지를 즐겨 차며, 최대 사이즈는 34mm로 하고 있습니다.</li>
              <li>🛡️ 파네라이는 방간 맛으로 차는 시계니까 추천 사이즈와 무관하게 호신용으로 좋아보이는걸 선택하세요.</li>
            </ul>
          </div>
        </div>

        <section className="p-8 text-center">
          <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
            <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noreferrer" className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition">YouTube 채널 구독하기</a>
            <button onClick={() => handleShare()} className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition">다른 시계 덕후에게 공유하기</button>
          </div>
          {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
        </section>
      </main>
    </>
  );
}
