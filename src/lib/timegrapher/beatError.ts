export type BeatErrorEstimate = {
  ms: number | null;
  sampleCount: number;
  /** 이상치로 버린 간격의 비율. 오검출·누락이 많을수록(=소음이 심할수록) 커진다. */
  droppedRatio: number | null;
  confidence: 'ok' | 'low';
};

const MIN_PEAKS_FOR_BEAT_ERROR = 20;
const MIN_GROUP_SAMPLES = 8;

/**
 * 버린 간격이 이 비율을 넘으면 짝/홀 교대 자체가 자주 끊겼다는 뜻이라 값을 믿기 어렵다.
 *
 * 미리 뽑아둔 온셋으로 재보면 조용한 원본이 0.01·0.15, 소음을 흉내내면 0.17~0.26(약간)
 * → 0.31~0.36(보통) → 0.45~0.48(시끄러움)이라 처음엔 0.3에 선을 뒀다. 그런데 브라우저에서
 * 실시간 검출로 돌리면 같은 녹음도 실행마다 결과가 흔들려(조용한 원본 8회 중 1회 경고),
 * 0.3에서는 잘 잰 사용자에게 잘못된 경고가 나갔다.
 *
 * 비트에러는 원래 편차가 큰 지표라(같은 조용한 녹음에서도 0.6~3.5ms) 경고를 촘촘히 걸어도
 * 실익이 적다. 놓치는 쪽보다 잘못 겁주는 쪽이 손해라 0.4로 넉넉히 잡는다. 대신 소음이 심해
 * 값이 아예 안 나오는 경우는 호출부에서 따로 경고하므로, 최악의 경우가 새어나가지는 않는다.
 */
const MAX_CLEAN_DROP_RATIO = 0.4;

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
    return { ms: null, sampleCount: 0, droppedRatio: null, confidence: 'low' };
  }

  const sorted = [...peakTimestamps].sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i] - sorted[i - 1]);
  }

  const roughMedian = median(intervals);
  const groups: [number[], number[]] = [[], []];
  let parity: 0 | 1 = 0;
  let dropped = 0;
  for (const interval of intervals) {
    if (interval < roughMedian * 0.6 || interval > roughMedian * 1.6) {
      dropped++;
      continue; // 이상치는 버리고, 짝/홀 순서를 깨지 않은 채 다음 간격으로 넘어간다
    }
    groups[parity].push(interval);
    parity = parity === 0 ? 1 : 0;
  }
  const droppedRatio = dropped / intervals.length;

  if (groups[0].length < MIN_GROUP_SAMPLES || groups[1].length < MIN_GROUP_SAMPLES) {
    return { ms: null, sampleCount: 0, droppedRatio, confidence: 'low' };
  }

  const avg = (arr: number[]) => arr.reduce((sum, v) => sum + v, 0) / arr.length;
  const beatErrorMs = Math.abs(avg(groups[0]) - avg(groups[1])) * 1000;

  return {
    ms: beatErrorMs,
    sampleCount: groups[0].length + groups[1].length,
    droppedRatio,
    confidence: droppedRatio > MAX_CLEAN_DROP_RATIO ? 'low' : 'ok',
  };
}
