/**
 * BPH · Rate · Beat Error · 바이브로그래프가 함께 쓰는 통계 도구.
 *
 * 네 파일이 저마다 같은 median 을 들고 있었고, "정렬 후 이웃 간격"과 Theil-Sen 적합도
 * 두 벌씩 복사돼 있었다. tick 통계는 이 앱의 측정값이 나오는 유일한 자리라 계산이 갈리면
 * 화면의 숫자와 그래프가 서로 다른 말을 하게 된다 — 한 벌만 두고 모두 여기서 가져다 쓴다.
 */

/** 오름차순으로 세운 뒤 가운데 값. 짝수 개면 가운데 둘의 평균. */
export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** 산술평균 */
export function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * 놓친 tick 은 간격을 정확히 2배로 만들 수 있어 경계값과 딱 맞아떨어지면 안 걸러질 수 있으므로
 * 여유를 두고 중앙값의 0.6~1.6배만 남긴다(놓친 tick · 잡음성 중복 검출을 함께 걸러낸다).
 *
 * 예전에는 bphEstimator 가 열린 구간(> 0.6 && < 1.6), beatError 가 닫힌 구간으로 각각
 * 판정해 경계에서만 답이 갈렸다. 같은 tick 을 같은 기준으로 봐야 하므로 열린 구간으로 모은다.
 */
export const INTERVAL_MIN_RATIO = 0.6;
export const INTERVAL_MAX_RATIO = 1.6;

export function isPlausibleInterval(interval: number, roughMedian: number): boolean {
  return interval > roughMedian * INTERVAL_MIN_RATIO && interval < roughMedian * INTERVAL_MAX_RATIO;
}

/** 타임스탬프를 오름차순으로 세우고 이웃 간 간격을 뽑는다. */
export function sortedIntervals(timestamps: number[]): { sorted: number[]; intervals: number[] } {
  const sorted = [...timestamps].sort((a, b) => a - b);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i] - sorted[i - 1]);
  }
  return { sorted, intervals };
}

/**
 * 각 tick 에 이론 간격 기준 가장 가까운 정수 비트 인덱스를 매긴다.
 * 첫 tick 이 0 번 비트이고, 놓친 tick 이 있으면 그만큼 번호가 건너뛴다.
 */
export function beatIndicesOf(sorted: number[], theoreticalInterval: number): number[] {
  const first = sorted[0];
  return sorted.map((t) => Math.round((t - first) / theoreticalInterval));
}

/**
 * Theil-Sen 추정에 쓸 모든 tick 쌍의 기울기(= 비트 하나에 걸린 시간).
 * 중앙값을 취하면 오검출·놓친 tick 이 몇 개 섞여도 결과가 거의 흔들리지 않는다.
 */
export function beatSlopes(sorted: number[], beatIndices: number[]): number[] {
  const slopes: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const beatDelta = beatIndices[j] - beatIndices[i];
      if (beatDelta === 0) continue;
      slopes.push((sorted[j] - sorted[i]) / beatDelta);
    }
  }
  return slopes;
}

/**
 * 적합선에서 각 tick 이 벗어난 정도(초, 부호 있음).
 * 값 자체가 아니라 "그 값을 얼마나 믿을 수 있는지"를 재는 지표이자, 바이브로그래프가 그리는 곡선이다.
 */
export function beatDeviations(sorted: number[], beatIndices: number[], secondsPerBeat: number): number[] {
  const first = sorted[0];
  return sorted.map((t, i) => t - (first + beatIndices[i] * secondsPerBeat));
}
