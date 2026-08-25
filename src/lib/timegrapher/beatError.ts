export type BeatErrorEstimate = {
  ms: number | null;
  sampleCount: number;
};

const MIN_PEAKS_FOR_BEAT_ERROR = 20;
const MIN_GROUP_SAMPLES = 8;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * tick을 짝수/홀수로 교대 분리해 두 그룹의 평균 간격 차이를 beat error(ms)로 계산한다.
 * 놓친 tick이나 오검출로 생긴 이상치 간격이 하나라도 섞이면 그 뒤로 짝/홀 정렬이 통째로
 * 밀려버리므로, 이상치 간격은 건너뛰고(짝/홀 어느 그룹에도 넣지 않고) 그 지점에서 교대 순서를
 * 다시 맞춰나간다. 이렇게 하면 실측 데이터에 섞이기 쉬운 소수의 오검출 때문에 전체 계산이
 * 영구히 실패하지 않는다.
 */
export function calculateBeatError(peakTimestamps: number[]): BeatErrorEstimate {
  if (peakTimestamps.length < MIN_PEAKS_FOR_BEAT_ERROR) {
    return { ms: null, sampleCount: 0 };
  }

  const sorted = [...peakTimestamps].sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i] - sorted[i - 1]);
  }

  const roughMedian = median(intervals);
  const groups: [number[], number[]] = [[], []];
  let parity: 0 | 1 = 0;
  for (const interval of intervals) {
    if (interval < roughMedian * 0.6 || interval > roughMedian * 1.6) {
      continue; // 이상치는 버리고, 짝/홀 순서를 깨지 않은 채 다음 간격으로 넘어간다
    }
    groups[parity].push(interval);
    parity = parity === 0 ? 1 : 0;
  }

  if (groups[0].length < MIN_GROUP_SAMPLES || groups[1].length < MIN_GROUP_SAMPLES) {
    return { ms: null, sampleCount: 0 };
  }

  const avg = (arr: number[]) => arr.reduce((sum, v) => sum + v, 0) / arr.length;
  const beatErrorMs = Math.abs(avg(groups[0]) - avg(groups[1])) * 1000;

  return { ms: beatErrorMs, sampleCount: groups[0].length + groups[1].length };
}
