import { describe, expect, it } from 'vitest';
import { STANDARD_BPH_VALUES, estimateBph } from '../bphEstimator';
import { dropAt, insertAt, makeTicks } from './fixtures';

describe('estimateBph', () => {
  it.each(STANDARD_BPH_VALUES)('표준 진동수 %i 을 되찾는다', (bph) => {
    const result = estimateBph(makeTicks({ bph, seconds: 10 }));
    expect(result.bph).toBe(bph);
    expect(result.confidence).toBe('high');
  });

  it('tick 이 모자라면 값을 내지 않는다', () => {
    const result = estimateBph(makeTicks({ bph: 28800, seconds: 10 }).slice(0, 7));
    expect(result).toEqual({ bph: null, rawIntervalSeconds: null, confidence: 'low' });
  });

  it('경계값 8개면 값을 낸다', () => {
    expect(estimateBph(makeTicks({ bph: 28800, seconds: 10 }).slice(0, 8)).bph).toBe(28800);
  });

  it('빈 배열도 터지지 않는다', () => {
    expect(estimateBph([]).bph).toBeNull();
  });

  it('놓친 tick 이 섞여도 흔들리지 않는다', () => {
    const ticks = dropAt(makeTicks({ bph: 21600, seconds: 10 }), [5, 6, 20, 41]);
    expect(estimateBph(ticks).bph).toBe(21600);
  });

  it('오검출이 섞여도 흔들리지 않는다', () => {
    const ticks = insertAt(makeTicks({ bph: 21600, seconds: 10 }), [1.01, 2.02, 3.03]);
    expect(estimateBph(ticks).bph).toBe(21600);
  });

  it('순서가 뒤섞여 들어와도 정렬해서 본다', () => {
    const ticks = makeTicks({ bph: 18000, seconds: 10 });
    const shuffled = [...ticks].reverse();
    expect(estimateBph(shuffled).bph).toBe(estimateBph(ticks).bph);
  });

  it('내부 클록이 0 에서 시작하지 않아도 같은 값', () => {
    const shifted = makeTicks({ bph: 28800, seconds: 10, startAt: 1234.5 });
    expect(estimateBph(shifted).bph).toBe(28800);
  });

  it('표준값 사이에 끼면 신뢰도가 떨어진다', () => {
    // 21600 과 25200 의 중간 — 어느 쪽으로 스냅해도 8% 넘게 어긋난다
    const result = estimateBph(makeTicks({ bph: 23400, seconds: 10 }));
    expect(result.confidence).toBe('low');
  });

  it('rawIntervalSeconds 는 스냅 전 실측 간격이다', () => {
    const result = estimateBph(makeTicks({ bph: 28800, seconds: 10 }));
    expect(result.rawIntervalSeconds).toBeCloseTo(3600 / 28800, 6);
  });
});
