import { isPlausibleInterval, median, sortedIntervals } from './stats';

// 흔한 무브먼트 진동수(시간당 비트 수). Weishi No.1000 등 하드웨어 타임그래퍼 기준 9종.
export const STANDARD_BPH_VALUES = [12000, 14400, 18000, 19800, 21600, 25200, 28800, 36000, 43200] as const;

export type BphConfidence = 'low' | 'medium' | 'high';

export type BphEstimate = {
  bph: number | null;
  rawIntervalSeconds: number | null;
  confidence: BphConfidence;
};

const MIN_PEAKS_FOR_ESTIMATE = 8;

function snapToStandardBph(rawBph: number): number {
  return STANDARD_BPH_VALUES.reduce((closest, candidate) =>
    Math.abs(candidate - rawBph) < Math.abs(closest - rawBph) ? candidate : closest
  );
}

/**
 * 최근 tick 피크 타임스탬프(초 단위)로부터 BPH를 추정한다.
 * tick 검출 자체는 aubio(onsetDetector.ts)가 담당하므로, 여기서는 정제된 간격의 중앙값을
 * 표준 BPH 값에 스냅하는 간단한 통계만 담당한다.
 */
export function estimateBph(peakTimestamps: number[]): BphEstimate {
  if (peakTimestamps.length < MIN_PEAKS_FOR_ESTIMATE) {
    return { bph: null, rawIntervalSeconds: null, confidence: 'low' };
  }

  const { intervals } = sortedIntervals(peakTimestamps);
  const roughMedian = median(intervals);
  const filtered = intervals.filter((v) => isPlausibleInterval(v, roughMedian));
  if (filtered.length < MIN_PEAKS_FOR_ESTIMATE - 1) {
    return { bph: null, rawIntervalSeconds: null, confidence: 'low' };
  }

  const refinedInterval = median(filtered);
  const rawBph = 3600 / refinedInterval;
  const snapped = snapToStandardBph(rawBph);

  const deviation = Math.abs(rawBph - snapped) / snapped;
  const confidence: BphConfidence = deviation < 0.03 ? 'high' : deviation < 0.08 ? 'medium' : 'low';

  return { bph: snapped, rawIntervalSeconds: refinedInterval, confidence };
}
