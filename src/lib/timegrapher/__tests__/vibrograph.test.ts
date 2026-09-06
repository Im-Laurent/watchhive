import { describe, expect, it } from 'vitest';
import { deviationsMs, movingAverage } from '../vibrograph';
import { makeTicks } from './fixtures';

/**
 * 리팩터링 전의 구현. 지점마다 전체를 훑던 O(n²) 방식이다.
 * 창을 밀고 가는 새 구현이 이것과 같은 값을 내는지 대조하는 데만 쓴다.
 */
function naiveMovingAverage(times: number[], values: number[], windowSeconds: number): number[] {
  return times.map((t) => {
    let sum = 0;
    let count = 0;
    for (let j = 0; j < times.length; j++) {
      if (Math.abs(times[j] - t) <= windowSeconds / 2) {
        sum += values[j];
        count++;
      }
    }
    return sum / count;
  });
}

describe('movingAverage', () => {
  it('예전 O(n²) 구현과 같은 값을 낸다', () => {
    const times = makeTicks({ bph: 28800, seconds: 17, jitterMs: 8, seed: 3 });
    const values = deviationsMs(times, 28800);
    const fast = movingAverage(times, values, 2);
    const slow = naiveMovingAverage(times, values, 2);
    expect(fast).toHaveLength(slow.length);
    fast.forEach((v, i) => expect(v).toBeCloseTo(slow[i], 9));
  });

  it.each([0.5, 1, 2, 5])('창 폭 %i초에서도 예전 구현과 일치', (windowSeconds) => {
    const times = makeTicks({ bph: 21600, seconds: 17, jitterMs: 12, seed: 11 });
    const values = deviationsMs(times, 21600);
    const fast = movingAverage(times, values, windowSeconds);
    const slow = naiveMovingAverage(times, values, windowSeconds);
    fast.forEach((v, i) => expect(v).toBeCloseTo(slow[i], 9));
  });

  it('상수 신호는 그대로 남는다', () => {
    const times = [0, 1, 2, 3, 4];
    expect(movingAverage(times, [5, 5, 5, 5, 5], 2)).toEqual([5, 5, 5, 5, 5]);
  });

  it('창 안에 자기 자신뿐이면 원래 값', () => {
    const times = [0, 10, 20];
    expect(movingAverage(times, [1, 2, 3], 2)).toEqual([1, 2, 3]);
  });

  it('흔들림을 줄인다 — 곡선을 그리는 이유', () => {
    const times = makeTicks({ bph: 28800, seconds: 17, jitterMs: 15, seed: 5 });
    const raw = deviationsMs(times, 28800);
    const smoothed = movingAverage(times, raw, 2);
    const spread = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
    expect(spread(smoothed)).toBeLessThan(spread(raw));
  });

  it('tick 하나짜리도 터지지 않는다', () => {
    expect(movingAverage([0], [7], 2)).toEqual([7]);
  });

  it('빈 입력은 빈 결과', () => {
    expect(movingAverage([], [], 2)).toEqual([]);
  });
});

describe('deviationsMs', () => {
  it('완벽한 시계는 편차가 0 인 평평한 선', () => {
    const times = makeTicks({ bph: 28800, seconds: 15 });
    deviationsMs(times, 28800).forEach((d) => expect(d).toBeCloseTo(0, 6));
  });

  it('일정하게 빠른 시계도 기준선을 다시 맞춰 평평해진다', () => {
    // 기준선은 Theil-Sen 으로 실측에 적합시키므로, 일정한 오차는 곡선에 나타나지 않는다.
    // 곡선이 보여주는 것은 "일정한 빠름/느림"이 아니라 그 흐름의 변화다.
    const times = makeTicks({ bph: 28800, seconds: 15, secondsPerDay: 40 });
    deviationsMs(times, 28800).forEach((d) => expect(Math.abs(d)).toBeLessThan(0.5));
  });

  it('결과 개수는 tick 개수와 같다', () => {
    const times = makeTicks({ bph: 21600, seconds: 10 });
    expect(deviationsMs(times, 21600)).toHaveLength(times.length);
  });

  it('ms 단위로 돌려준다', () => {
    // 마지막 tick 만 10ms 늦게 온 경우
    const times = makeTicks({ bph: 28800, seconds: 5 });
    times[times.length - 1] += 0.01;
    const deviations = deviationsMs(times, 28800);
    expect(deviations[deviations.length - 1]).toBeCloseTo(10, 0);
  });

  it('tick 이 하나뿐이면 이론 간격을 기준선으로 삼아 0 을 낸다', () => {
    expect(deviationsMs([1.5], 28800)).toEqual([0]);
  });
});
