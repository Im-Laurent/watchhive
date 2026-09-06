/**
 * 바이브로그래프(측정 화면의 곡선)가 쓰는 계산. 그리는 일과 분리해 두면 값만 따로 검증할 수 있다.
 *
 * 처음엔 오픈소스 vacaboja/tg의 "paperstrip"(점이 흩뿌려지는 방식)을 이식했지만, 실기기로
 * 테스트해보니 폰 마이크의 tick당 타이밍 오차(~11ms)가 한 tick 단위로 보기엔 너무 커서 점들이
 * 뭉치지 않고 흩어져 보였다. 실제 Witschi 타임그래퍼 화면은 점이 아니라 부드럽게 이어지는
 * 연속 곡선인데, 실제 녹음(론진 수동/까르띠에 자동)으로 확인해보니 그 이유를 알 수 있었다:
 * tick 하나하나의 절대 타이밍은 노이즈가 크지만, 여러 tick을 이동평균으로 스무딩하면(약 2초 분량)
 * 그 노이즈가 상쇄되고 실제로 의미 있는 완만한 추이가 매끄러운 곡선으로 드러난다 — Theil-Sen으로
 * 이미 신뢰도를 검증한 Rate 계산과 같은 원리를 시각화에도 적용한 것.
 *
 * 시각화 전용이라 여기 정밀도가 떨어져도 화면에 뜨는 측정 수치에는 영향이 없다.
 */
import { beatDeviations, beatIndicesOf, beatSlopes, median } from './stats';

/**
 * Theil-Sen(모든 tick 쌍의 기울기 중앙값)으로 기준선을 구하고, 각 tick이 그 기준선에서
 * 얼마나 벗어났는지를 ms 로 돌려준다. rateCalculator 와 같은 적합을 시각화용으로 재사용한다.
 */
export function deviationsMs(peaks: number[], bph: number): number[] {
  const theoretical = 3600 / bph;
  const beatIndices = beatIndicesOf(peaks, theoretical);
  const slopes = beatSlopes(peaks, beatIndices);
  // tick 이 하나뿐이라 쌍을 만들 수 없으면 이론 간격을 그대로 기준선으로 삼는다.
  const fittedInterval = slopes.length > 0 ? median(slopes) : theoretical;
  return beatDeviations(peaks, beatIndices, fittedInterval).map((s) => s * 1000);
}

/**
 * 각 지점을 중심으로 ±(windowSeconds/2) 안에 든 값의 평균. tick 간격이 일정하지 않아
 * 개수가 아니라 시간 폭으로 창을 잡는다. times 는 오름차순이어야 한다.
 */
export function movingAverage(times: number[], values: number[], windowSeconds: number): number[] {
  const half = windowSeconds / 2;
  const result: number[] = [];
  // times 가 정렬돼 있으므로 창의 양 끝을 같이 밀고 간다 — 지점마다 전체를 훑던 O(n²) 를 없앤다.
  let lo = 0;
  let hi = 0;
  let sum = 0;
  for (let i = 0; i < times.length; i++) {
    while (hi < times.length && times[hi] - times[i] <= half) {
      sum += values[hi];
      hi++;
    }
    while (times[i] - times[lo] > half) {
      sum -= values[lo];
      lo++;
    }
    result.push(sum / (hi - lo));
  }
  return result;
}
