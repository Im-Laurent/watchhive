import { describe, expect, it } from 'vitest';
import { calculateBeatError } from '../beatError';
import { dropAt, insertAt, makeTicks } from './fixtures';

describe('calculateBeatError', () => {
  it('짝/홀 간격이 같으면 비트에러 0', () => {
    const result = calculateBeatError(makeTicks({ bph: 28800, seconds: 15 }));
    expect(result.ms).toBeCloseTo(0, 6);
    expect(result.confidence).toBe('ok');
  });

  it.each([0.3, 0.8, 1.5, 3])('비트에러 %ims 를 되찾는다', (beatErrorMs) => {
    const ticks = makeTicks({ bph: 28800, seconds: 15, beatErrorMs });
    expect(calculateBeatError(ticks).ms).toBeCloseTo(beatErrorMs, 3);
  });

  it('절댓값이라 어느 쪽으로 치우쳤든 부호는 없다', () => {
    const a = calculateBeatError(makeTicks({ bph: 21600, seconds: 15, beatErrorMs: 1.2 }));
    const b = calculateBeatError(makeTicks({ bph: 21600, seconds: 15, beatErrorMs: -1.2 }));
    expect(a.ms).toBeCloseTo(b.ms!, 6);
    expect(a.ms!).toBeGreaterThan(0);
  });

  it('tick 이 20개 미만이면 값을 내지 않는다', () => {
    const ticks = makeTicks({ bph: 28800, seconds: 15 }).slice(0, 19);
    expect(calculateBeatError(ticks)).toEqual({
      ms: null,
      sampleCount: 0,
      droppedRatio: null,
      confidence: 'low',
    });
  });

  it('빈 배열도 터지지 않는다', () => {
    expect(calculateBeatError([]).ms).toBeNull();
  });

  it('놓친 tick 이 있어도 짝/홀 교대가 통째로 밀리지 않는다', () => {
    // 이상치 간격을 버리고 교대 순서를 다시 맞추는 것이 이 함수의 핵심이다.
    const clean = makeTicks({ bph: 28800, seconds: 15, beatErrorMs: 1 });
    const lossy = dropAt(clean, [10, 30, 55]);
    const result = calculateBeatError(lossy);
    expect(result.ms).toBeCloseTo(1, 1);
    expect(result.droppedRatio!).toBeGreaterThan(0);
  });

  it('버린 간격이 많으면 신뢰도를 낮춘다', () => {
    const noisy = insertAt(
      makeTicks({ bph: 28800, seconds: 15 }),
      Array.from({ length: 90 }, (_, i) => 0.02 + i * 0.16)
    );
    const result = calculateBeatError(noisy);
    expect(result.droppedRatio!).toBeGreaterThan(0.4);
    expect(result.confidence).toBe('low');
  });

  it('깨끗하면 droppedRatio 가 0', () => {
    expect(calculateBeatError(makeTicks({ bph: 28800, seconds: 15 })).droppedRatio).toBe(0);
  });

  it('순서가 뒤섞여 들어와도 정렬해서 본다', () => {
    const ticks = makeTicks({ bph: 28800, seconds: 15, beatErrorMs: 1.5 });
    expect(calculateBeatError([...ticks].reverse()).ms).toBeCloseTo(1.5, 3);
  });

  it('sampleCount 는 두 그룹에 실제로 담긴 간격 수', () => {
    const result = calculateBeatError(makeTicks({ bph: 28800, seconds: 15 }));
    expect(result.sampleCount).toBeGreaterThanOrEqual(16);
  });
});
