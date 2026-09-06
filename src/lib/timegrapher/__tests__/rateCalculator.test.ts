import { describe, expect, it } from 'vitest';
import { calculateRate } from '../rateCalculator';
import { dropAt, insertAt, makeTicks } from './fixtures';

describe('calculateRate', () => {
  it('정확히 맞는 시계는 0초/일', () => {
    const result = calculateRate(makeTicks({ bph: 28800, seconds: 15 }), 28800);
    expect(result.secondsPerDay).toBeCloseTo(0, 6);
    expect(result.confidence).toBe('ok');
  });

  it.each([-60, -20, -5, 5, 20, 60])('하루 %i초 오차를 되찾는다', (secondsPerDay) => {
    const ticks = makeTicks({ bph: 28800, seconds: 15, secondsPerDay });
    expect(calculateRate(ticks, 28800).secondsPerDay).toBeCloseTo(secondsPerDay, 3);
  });

  it('빨리 가면 양수, 늦게 가면 음수', () => {
    const fast = calculateRate(makeTicks({ bph: 21600, seconds: 15, secondsPerDay: 30 }), 21600);
    const slow = calculateRate(makeTicks({ bph: 21600, seconds: 15, secondsPerDay: -30 }), 21600);
    expect(fast.secondsPerDay!).toBeGreaterThan(0);
    expect(slow.secondsPerDay!).toBeLessThan(0);
  });

  it('bph 를 모르면 계산하지 않는다', () => {
    const ticks = makeTicks({ bph: 28800, seconds: 15 });
    expect(calculateRate(ticks, null).secondsPerDay).toBeNull();
  });

  it('tick 이 모자라면 계산하지 않는다', () => {
    const ticks = makeTicks({ bph: 28800, seconds: 15 }).slice(0, 7);
    expect(calculateRate(ticks, 28800).secondsPerDay).toBeNull();
  });

  it('빈 배열도 터지지 않는다', () => {
    expect(calculateRate([], 28800).secondsPerDay).toBeNull();
  });

  it('놓친 tick 몇 개로는 결과가 튀지 않는다 — Theil-Sen 을 쓰는 이유', () => {
    const clean = makeTicks({ bph: 28800, seconds: 15, secondsPerDay: 12 });
    const lossy = dropAt(clean, [3, 17, 40, 41, 90]);
    expect(calculateRate(lossy, 28800).secondsPerDay).toBeCloseTo(12, 1);
  });

  it('오검출이 섞여도 결과가 튀지 않는다', () => {
    const clean = makeTicks({ bph: 28800, seconds: 15, secondsPerDay: 12 });
    const noisy = insertAt(clean, [1.031, 4.062, 9.101]);
    expect(calculateRate(noisy, 28800).secondsPerDay).toBeCloseTo(12, 0);
  });

  it('깨끗한 신호는 지터가 0 에 가깝고 신뢰할 만하다', () => {
    const result = calculateRate(makeTicks({ bph: 28800, seconds: 15 }), 28800);
    expect(result.jitterMs).toBeCloseTo(0, 6);
    expect(result.confidence).toBe('ok');
  });

  it('타이밍이 심하게 흔들리면 낮은 신뢰도로 표시한다', () => {
    // ±20ms 무작위 흔들림 — 실측에서 "시끄러움"에 해당하는 수준
    const jittered = makeTicks({ bph: 28800, seconds: 15, jitterMs: 20, seed: 7 });
    const result = calculateRate(jittered, 28800);
    expect(result.jitterMs!).toBeGreaterThan(6);
    expect(result.confidence).toBe('low');
  });

  it('약하게 흔들리는 정도는 여전히 신뢰한다', () => {
    const result = calculateRate(makeTicks({ bph: 28800, seconds: 15, jitterMs: 3, seed: 7 }), 28800);
    expect(result.jitterMs!).toBeLessThan(6);
    expect(result.confidence).toBe('ok');
  });

  it('짝/홀이 규칙적으로 어긋나는 것(비트에러)은 지터로 세지 않는다', () => {
    // 이쪽은 calculateBeatError 가 재는 값이다. 여기서 겹쳐 경고하면 같은 사실을 두 번 말하게 된다.
    const result = calculateRate(makeTicks({ bph: 28800, seconds: 15, beatErrorMs: 4 }), 28800);
    expect(result.confidence).toBe('ok');
  });

  it('sampleCount 는 실제로 쓴 tick 수', () => {
    const ticks = makeTicks({ bph: 18000, seconds: 15 });
    expect(calculateRate(ticks, 18000).sampleCount).toBe(ticks.length);
  });

  it('내부 클록이 0 에서 시작하지 않아도 같은 값', () => {
    const a = calculateRate(makeTicks({ bph: 28800, seconds: 15, secondsPerDay: 8 }), 28800);
    const b = calculateRate(
      makeTicks({ bph: 28800, seconds: 15, secondsPerDay: 8, startAt: 987.65 }),
      28800
    );
    expect(a.secondsPerDay).toBeCloseTo(b.secondsPerDay!, 6);
  });
});
