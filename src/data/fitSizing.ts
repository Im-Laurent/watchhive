import { SIZE_CHART } from './sizeChart';

/**
 * 손목 단면 너비로 어울리는 케이스·러그 크기를 낸다.
 *
 * 드레스/빅사이즈는 손목 너비에 대한 비율로 계산하고, 툴 워치만 SIZE_CHART(실측 표)를 본다.
 * 화면에서 떼어내 값만 따로 검증할 수 있게 둔다.
 */
export type WatchType = 'dress-watch' | 'tool-watch' | 'generous-fit';

export type FitRecommendation = {
  /** "33.0mm ~ 38.5mm" 처럼 사람이 읽는 문구 */
  recCase: string;
  recLug: string;
  /** 손목 대비 비율을 그리는 데 쓰는 케이스 최대 지름(mm) */
  caseMax: number;
};

export const MIN_WRIST = 40;
export const MAX_WRIST = 65;

/** 드레스는 손목의 60~70%, 빅사이즈는 75~80%. 툴 워치는 표를 따른다. */
const RATIOS: Record<Exclude<WatchType, 'tool-watch'>, { min: number; max: number; lug: number }> = {
  'dress-watch': { min: 0.6, max: 0.7, lug: 0.85 },
  'generous-fit': { min: 0.75, max: 0.8, lug: 0.9 },
};

const mm = (value: number) => `${value.toFixed(1)}mm`;

export function computeFit(type: WatchType, wrist: number): FitRecommendation {
  if (type !== 'tool-watch') {
    const { min, max, lug } = RATIOS[type];
    return {
      recCase: `${mm(wrist * min)} ~ ${mm(wrist * max)}`,
      recLug: mm(wrist * lug),
      caseMax: wrist * max,
    };
  }

  // 표에 없는 손목 너비면 첫 행으로 떨어진다 — 슬라이더가 40~65 로 묶여 있어 실제로는 늘 맞는다.
  const row = SIZE_CHART.find((r) => r.crossSection === Math.round(wrist)) ?? SIZE_CHART[0];
  const caseMax = parseFloat(row.caseSizes[1]);
  return {
    recCase: `${mm(caseMax - 2)} ~ ${mm(caseMax)}`,
    recLug: mm(parseFloat(row.maxLugToLug) - 1),
    caseMax,
  };
}
