import { describe, expect, it } from 'vitest';
import {
  DISCLAIMERS,
  GRADE_LABEL,
  REFERENCE_ROWS,
  judgeBeatError,
  judgeRate,
  lowConfidenceHint,
} from '../referenceRanges';

describe('judgeRate', () => {
  it.each([0, 5, 10, -10])('±10초/일 이내 (%i) 는 우수', (v) => {
    expect(judgeRate(v)).toBe('excellent');
  });

  it.each([10.1, 20, -20])('10~20초/일 (%i) 는 양호', (v) => {
    expect(judgeRate(v)).toBe('good');
  });

  it.each([20.1, 50, -50])('20초/일 초과 (%i) 는 주의', (v) => {
    expect(judgeRate(v)).toBe('caution');
  });

  it('부호와 무관하게 크기로만 판정한다', () => {
    expect(judgeRate(15)).toBe(judgeRate(-15));
  });
});

describe('judgeBeatError', () => {
  it.each([0, 0.3, 0.5])('0.5ms 이내 (%i) 는 우수', (v) => {
    expect(judgeBeatError(v)).toBe('excellent');
  });

  it.each([0.51, 1.0])('1.0ms 이내 (%i) 는 양호', (v) => {
    expect(judgeBeatError(v)).toBe('good');
  });

  it.each([1.01, 3])('1.0ms 초과 (%i) 는 주의', (v) => {
    expect(judgeBeatError(v)).toBe('caution');
  });
});

describe('표시 데이터', () => {
  it('모든 등급에 한글 이름이 있다', () => {
    expect(GRADE_LABEL.excellent).toBe('우수');
    expect(GRADE_LABEL.good).toBe('양호');
    expect(GRADE_LABEL.caution).toBe('주의');
  });

  it('참고 기준은 화면에 뜨는 두 지표를 모두 다룬다', () => {
    expect(REFERENCE_ROWS.map((r) => r.metric)).toEqual(['일오차 (Rate)', '비트에러 (Beat Error)']);
    REFERENCE_ROWS.forEach((row) => {
      expect(row.serviced.length).toBeGreaterThan(0);
      expect(row.vintage.length).toBeGreaterThan(0);
    });
  });

  it('고지 항목은 제목과 본문이 모두 채워져 있다', () => {
    expect(DISCLAIMERS.length).toBeGreaterThan(0);
    DISCLAIMERS.forEach((item) => {
      expect(item.title.trim()).not.toBe('');
      expect(item.body.trim()).not.toBe('');
    });
  });
});

describe('lowConfidenceHint', () => {
  it('흔들린 지표를 가운뎃점으로 이어 붙인다', () => {
    expect(lowConfidenceHint(['진동수', '일오차'])).toContain('진동수 · 일오차');
  });

  it('하나만 흔들려도 문장이 성립한다', () => {
    expect(lowConfidenceHint(['비트에러'])).toContain('비트에러 값이 흔들렸어요');
  });

  it('조치 안내가 함께 나간다', () => {
    expect(lowConfidenceHint(['진동수'])).toContain('다시 측정해 보세요');
  });
});
