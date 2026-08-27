export type RateEstimate = {
  secondsPerDay: number | null;
  sampleCount: number;
  /** 적합선에서 각 tick이 벗어난 정도(중앙값, ms). 주변 소음이 섞일수록 커진다. */
  jitterMs: number | null;
  confidence: 'ok' | 'low';
};

const MIN_PEAKS_FOR_RATE = 8;

/**
 * 이 값을 넘으면 tick 타이밍이 너무 흔들려 하루 오차를 믿기 어렵다고 본다.
 *
 * aubio의 hop(~11ms) 때문에 검출 시각 자체에 ±5.5ms 정도의 양자화 오차가 깔려 있어,
 * 잔차가 그 절반 수준이면 "검출기 정밀도만큼 깨끗한" 상태다. 실제 녹음 두 종으로 재보니
 * 조용한 환경의 원본이 1.6ms·3.8ms였고, 오검출·누락·지터를 섞어 소음을 흉내내자
 * 6.6~7.7ms(보통 소음) → 16.8~18.3ms(시끄러움)로 단조롭게 올라갔다. 보통 소음 구간에서
 * 이미 하루 오차가 15초/일가량 밀렸으므로, 그 구간부터 경고하도록 6ms에 선을 둔다.
 */
const MAX_CLEAN_JITTER_MS = 6;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * tick 간격을 실측값과 이론값(3600/BPH)의 합으로 단순 비교하던 이전 방식은, 실제 녹음
 * 데이터로 검증해보니 하나의 오검출/놓친 tick만으로도 결과가 수백~천 단위 s/day로 튀는
 * 문제가 있었다(들쭉날쭉했던 실측 사례로 확인됨). aubio의 tick 검출 시각 자체가 hop 크기
 * (~11ms) 단위로만 정밀하고, 실제 시계+마이크 녹음은 tick 사이도 완전한 무음이 아니라
 * 배경 소음이 계속 섞여 있어 이따금 오검출/누락이 생기기 때문이다.
 *
 * 그래서 Theil-Sen 추정(모든 tick 쌍의 기울기 중앙값)으로 하루 오차를 구한다. 각 tick에
 * 이론 간격 기준 가장 가까운 정수 비트 인덱스를 매긴 뒤, 모든 tick 쌍 (i, j)에 대해
 * (시간차)/(비트 인덱스차)를 구하고 그 중앙값을 실제 초당 비트 시간으로 삼는다. 중앙값이라
 * 이상치(오검출·놓친 tick) 몇 개가 섞여도 전체 결과가 거의 흔들리지 않는다 — 실제 녹음 두
 * 종(수동/자동 무브먼트)으로 검증했을 때, 반복 측정 간 결과가 훨씬 안정적으로 수렴했다.
 */
export function calculateRate(peakTimestamps: number[], bph: number | null): RateEstimate {
  if (!bph || peakTimestamps.length < MIN_PEAKS_FOR_RATE) {
    return { secondsPerDay: null, sampleCount: 0, jitterMs: null, confidence: 'low' };
  }

  const sorted = [...peakTimestamps].sort((a, b) => a - b);
  const theoreticalInterval = 3600 / bph;
  const first = sorted[0];
  const beatIndices = sorted.map((t) => Math.round((t - first) / theoreticalInterval));

  const slopes: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const beatDelta = beatIndices[j] - beatIndices[i];
      if (beatDelta === 0) continue;
      slopes.push((sorted[j] - sorted[i]) / beatDelta);
    }
  }
  if (slopes.length < MIN_PEAKS_FOR_RATE - 1) {
    return { secondsPerDay: null, sampleCount: 0, jitterMs: null, confidence: 'low' };
  }

  const actualSecondsPerBeat = median(slopes);
  const secondsPerDay = ((theoreticalInterval - actualSecondsPerBeat) / theoreticalInterval) * 86400;

  // 추정한 비트 간격으로 되돌려 각 tick이 적합선에서 얼마나 벗어났는지 본다. 값 자체가
  // 아니라 "그 값을 얼마나 믿을 수 있는지"를 재는 지표다 — 소음이 섞이면 여기가 먼저 커진다.
  const residuals = sorted.map((t, i) => Math.abs(t - first - beatIndices[i] * actualSecondsPerBeat));
  const jitterMs = median(residuals) * 1000;

  return {
    secondsPerDay,
    sampleCount: sorted.length,
    jitterMs,
    confidence: jitterMs > MAX_CLEAN_JITTER_MS ? 'low' : 'ok',
  };
}
