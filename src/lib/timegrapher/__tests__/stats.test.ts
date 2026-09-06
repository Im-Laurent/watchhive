import { describe, expect, it } from 'vitest';
import {
  beatDeviations,
  beatIndicesOf,
  beatSlopes,
  isPlausibleInterval,
  mean,
  median,
  sortedIntervals,
} from '../stats';

describe('median', () => {
  it('홀수 개면 가운데 값', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('짝수 개면 가운데 둘의 평균', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('원본 배열을 정렬해 뒤엎지 않는다', () => {
    const values = [3, 1, 2];
    median(values);
    expect(values).toEqual([3, 1, 2]);
  });

  it('이상치가 섞여도 가운데를 지킨다 — Theil-Sen 이 기대는 성질', () => {
    expect(median([1, 2, 3, 4, 1000])).toBe(3);
  });
});

describe('mean', () => {
  it('산술평균', () => {
    expect(mean([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('isPlausibleInterval', () => {
  const rough = 0.125; // 28800 bph 의 tick 간격

  it('중앙값 근처는 통과', () => {
    expect(isPlausibleInterval(0.125, rough)).toBe(true);
    expect(isPlausibleInterval(0.13, rough)).toBe(true);
  });

  it('놓친 tick(2배 간격)은 걸러낸다', () => {
    expect(isPlausibleInterval(0.25, rough)).toBe(false);
  });

  it('중복 검출(절반 간격)도 걸러낸다', () => {
    expect(isPlausibleInterval(0.0625, rough)).toBe(false);
  });

  it('경계는 열린 구간 — 정확히 0.6배·1.6배는 제외', () => {
    expect(isPlausibleInterval(rough * 0.6, rough)).toBe(false);
    expect(isPlausibleInterval(rough * 1.6, rough)).toBe(false);
  });
});

describe('sortedIntervals', () => {
  it('정렬한 뒤 이웃 간 간격을 낸다', () => {
    const { sorted, intervals } = sortedIntervals([2, 0, 1]);
    expect(sorted).toEqual([0, 1, 2]);
    expect(intervals).toEqual([1, 1]);
  });

  it('간격 개수는 tick 개수보다 하나 적다', () => {
    expect(sortedIntervals([0, 1, 2, 3]).intervals).toHaveLength(3);
  });

  it('tick 이 하나면 간격이 없다', () => {
    expect(sortedIntervals([5]).intervals).toEqual([]);
  });
});

describe('beatIndicesOf', () => {
  it('첫 tick 이 0번이고 순서대로 번호가 붙는다', () => {
    expect(beatIndicesOf([0, 0.125, 0.25], 0.125)).toEqual([0, 1, 2]);
  });

  it('놓친 tick 만큼 번호를 건너뛴다', () => {
    // 두 번째 tick 이 통째로 빠진 경우 — 0, (누락), 2번 비트
    expect(beatIndicesOf([0, 0.25], 0.125)).toEqual([0, 2]);
  });

  it('약간 어긋난 시각도 가장 가까운 비트로 반올림한다', () => {
    expect(beatIndicesOf([0, 0.128, 0.249], 0.125)).toEqual([0, 1, 2]);
  });
});

describe('beatSlopes', () => {
  it('모든 tick 쌍의 기울기를 낸다 (nC2 개)', () => {
    const slopes = beatSlopes([0, 0.1, 0.2], [0, 1, 2]);
    expect(slopes).toHaveLength(3);
    slopes.forEach((s) => expect(s).toBeCloseTo(0.1, 10));
  });

  it('비트 번호가 같은 쌍(0으로 나누기)은 건너뛴다', () => {
    expect(beatSlopes([0, 0.001], [0, 0])).toEqual([]);
  });
});

describe('beatDeviations', () => {
  it('완벽하게 일정한 tick 은 편차가 0', () => {
    const deviations = beatDeviations([0, 0.1, 0.2], [0, 1, 2], 0.1);
    deviations.forEach((d) => expect(d).toBeCloseTo(0, 10));
  });

  it('늦게 온 tick 은 양수, 일찍 온 tick 은 음수 — 부호를 지킨다', () => {
    const deviations = beatDeviations([0, 0.11, 0.19], [0, 1, 2], 0.1);
    expect(deviations[1]).toBeCloseTo(0.01, 10);
    expect(deviations[2]).toBeCloseTo(-0.01, 10);
  });
});
