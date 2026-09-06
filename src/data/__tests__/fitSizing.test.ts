import { describe, expect, it } from 'vitest';
import { computeFit, MAX_WRIST, MIN_WRIST, type WatchType } from '../fitSizing';
import { SIZE_CHART } from '../sizeChart';

const ALL_TYPES: WatchType[] = ['dress-watch', 'tool-watch', 'generous-fit'];

describe('computeFit — 드레스 워치', () => {
  it('손목의 60~70% 를 추천한다', () => {
    expect(computeFit('dress-watch', 50).recCase).toBe('30.0mm ~ 35.0mm');
  });

  it('러그는 손목의 85%', () => {
    expect(computeFit('dress-watch', 50).recLug).toBe('42.5mm');
  });

  it('caseMax 는 추천 범위의 위쪽 끝', () => {
    expect(computeFit('dress-watch', 50).caseMax).toBeCloseTo(35, 10);
  });
});

describe('computeFit — 빅 사이즈', () => {
  it('손목의 75~80% 를 추천한다 — 드레스보다 크다', () => {
    expect(computeFit('generous-fit', 50).recCase).toBe('37.5mm ~ 40.0mm');
  });

  it('러그는 손목의 90%', () => {
    expect(computeFit('generous-fit', 50).recLug).toBe('45.0mm');
  });

  it('같은 손목에서 드레스보다 항상 큰 케이스를 낸다', () => {
    for (let wrist = MIN_WRIST; wrist <= MAX_WRIST; wrist++) {
      expect(computeFit('generous-fit', wrist).caseMax).toBeGreaterThan(
        computeFit('dress-watch', wrist).caseMax
      );
    }
  });
});

describe('computeFit — 툴 워치', () => {
  it('실측 표의 값을 그대로 쓴다', () => {
    // 손목 50mm → 표에서 ['35mm', '36mm'], 러그 45.0mm
    const row = SIZE_CHART.find((r) => r.crossSection === 50)!;
    expect(row.caseSizes).toEqual(['35mm', '36mm']);
    const fit = computeFit('tool-watch', 50);
    expect(fit.recCase).toBe('34.0mm ~ 36.0mm');
    expect(fit.recLug).toBe('44.0mm');
    expect(fit.caseMax).toBe(36);
  });

  it('소수점 손목 너비는 반올림해 표를 찾는다', () => {
    expect(computeFit('tool-watch', 50.4)).toEqual(computeFit('tool-watch', 50));
    expect(computeFit('tool-watch', 49.6)).toEqual(computeFit('tool-watch', 50));
  });

  it('표 밖의 손목 너비는 첫 행으로 떨어진다', () => {
    const first = computeFit('tool-watch', SIZE_CHART[0].crossSection);
    expect(computeFit('tool-watch', 999)).toEqual(first);
  });

  it('표의 모든 행에서 값을 낸다', () => {
    SIZE_CHART.forEach((row) => {
      const fit = computeFit('tool-watch', row.crossSection);
      expect(fit.caseMax).toBeGreaterThan(0);
      expect(fit.recCase).toMatch(/^\d+\.\d+mm ~ \d+\.\d+mm$/);
      expect(fit.recLug).toMatch(/^\d+\.\d+mm$/);
    });
  });
});

describe('computeFit — 공통', () => {
  it.each(ALL_TYPES)('%s: 손목이 굵을수록 케이스도 커진다 (단조 증가)', (type) => {
    let previous = 0;
    for (let wrist = MIN_WRIST; wrist <= MAX_WRIST; wrist++) {
      const { caseMax } = computeFit(type, wrist);
      expect(caseMax).toBeGreaterThanOrEqual(previous);
      previous = caseMax;
    }
  });

  it.each(ALL_TYPES)('%s: 케이스가 손목보다 크지 않다', (type) => {
    for (let wrist = MIN_WRIST; wrist <= MAX_WRIST; wrist++) {
      expect(computeFit(type, wrist).caseMax).toBeLessThanOrEqual(wrist);
    }
  });

  it.each(ALL_TYPES)('%s: 소수점 한 자리로 표기한다', (type) => {
    const fit = computeFit(type, 53);
    expect(fit.recCase).toMatch(/^\d+\.\d ?mm ~ \d+\.\dmm$/);
    expect(fit.recLug).toMatch(/^\d+\.\dmm$/);
  });

  it('슬라이더 범위가 뒤집혀 있지 않다', () => {
    expect(MIN_WRIST).toBeLessThan(MAX_WRIST);
  });
});
