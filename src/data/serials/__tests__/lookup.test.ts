import { describe, expect, it } from 'vitest';
import {
  findYearByPrefix,
  findYearByThreshold,
  findYearInRanges,
  lookupYear,
  normalizeSerial,
} from '../lookup';
import { IWC_SERIALS } from '../iwc';
import { LONGINES_SERIALS } from '../longines';
import { OMEGA_SERIALS } from '../omega';
import { ROLEX_SERIALS } from '../rolex';
import { UG_SERIALS } from '../ug';

describe('normalizeSerial', () => {
  it('영숫자만 남긴다', () => {
    expect(normalizeSerial('123-456 789')).toBe('123456789');
  });

  it('대문자로 맞춘다', () => {
    expect(normalizeSerial('r000001')).toBe('R000001');
  });

  it('기호만 있으면 빈 문자열', () => {
    expect(normalizeSerial('---')).toBe('');
  });
});

describe('findYearInRanges', () => {
  it('구간 안이면 그 해', () => {
    expect(findYearInRanges(ROLEX_SERIALS, 1050000)).toBe(1964);
  });

  it('구간의 양 끝을 포함한다', () => {
    expect(findYearInRanges(IWC_SERIALS, 1)).toBe(1884);
    expect(findYearInRanges(IWC_SERIALS, 6500)).toBe(1884);
    expect(findYearInRanges(IWC_SERIALS, 6501)).toBe(1885);
  });

  it('표에 없는 구간이면 null', () => {
    // IWC 는 1892 와 1900 사이가 비어 있다
    expect(findYearInRanges(IWC_SERIALS, 100000)).toBeNull();
  });

  it('NaN 은 null — 숫자가 아닌 시리얼이 들어와도 엉뚱한 해를 내지 않는다', () => {
    expect(findYearInRanges(ROLEX_SERIALS, NaN)).toBeNull();
  });

  it('구간 표의 year 가 문자열이면 그대로 돌려준다 (Universal Genève)', () => {
    expect(findYearInRanges(UG_SERIALS, 550000)).toBe('1930~1935');
  });
});

describe('findYearByPrefix', () => {
  it('접두 문자가 맞으면 그 해 — 롤렉스 R 은 1987', () => {
    expect(findYearByPrefix(ROLEX_SERIALS, 'R123456')).toBe(1987);
  });

  it('접두가 없으면 null', () => {
    expect(findYearByPrefix(ROLEX_SERIALS, '1234567')).toBeNull();
  });

  it('접두 행이 없는 표는 항상 null', () => {
    expect(findYearByPrefix(IWC_SERIALS, 'R123')).toBeNull();
  });
});

describe('findYearByThreshold (Omega)', () => {
  it('그 해 시작 시리얼과 정확히 같으면 그 해', () => {
    expect(findYearByThreshold(OMEGA_SERIALS, 1000000)).toBe(1895);
  });

  it('두 해 사이면 앞선 해', () => {
    expect(findYearByThreshold(OMEGA_SERIALS, 1200000)).toBe(1896);
  });

  it('표의 첫 시리얼보다 작으면 null', () => {
    expect(findYearByThreshold(OMEGA_SERIALS, 999999)).toBeNull();
  });

  it('표의 마지막 시리얼보다 크면 마지막 해', () => {
    expect(findYearByThreshold(OMEGA_SERIALS, 99999999)).toBe(1989);
  });

  it('NaN 은 null', () => {
    expect(findYearByThreshold(OMEGA_SERIALS, NaN)).toBeNull();
  });
});

describe('lookupYear', () => {
  it.each([
    ['Rolex', '1050000', '1964년'],
    ['Rolex', 'R000001', '1987년'],
    ['Omega', '1200000', '1896년'],
    ['IWC', '1', '1884년'],
    ['Longines', '1', '1867년'],
    ['UniversalGenève', '550000', '1930~1935년'],
  ])('%s / %s → %s', (brand, serial, expected) => {
    expect(lookupYear(brand, serial)).toBe(expected);
  });

  it('모르는 브랜드는 null', () => {
    expect(lookupYear('Seiko', '1234567')).toBeNull();
    expect(lookupYear('Casio', '1234567')).toBeNull();
  });

  it('범위 밖 시리얼은 null — 화면에서 안내 문구로 이어진다', () => {
    expect(lookupYear('Longines', '99999999')).toBeNull();
  });

  it('숫자가 아닌 시리얼은 null', () => {
    expect(lookupYear('IWC', 'ABCDEF')).toBeNull();
  });

  it('0x 로 시작해도 16진수로 해석하지 않는다', () => {
    // parseInt 에 radix 를 주지 않으면 '0X10' 이 16 이 된다 — 시리얼은 언제나 10진수다.
    expect(lookupYear('IWC', '0X10')).toBeNull();
  });
});

describe('시리얼 표 자체의 무결성', () => {
  it.each([
    ['Rolex', ROLEX_SERIALS],
    ['IWC', IWC_SERIALS],
    ['Longines', LONGINES_SERIALS],
    ['UniversalGenève', UG_SERIALS],
  ])('%s: 모든 구간이 start <= end', (_brand, table) => {
    for (const row of table) {
      if (row.serialStart != null && row.serialEnd != null) {
        expect(row.serialEnd).toBeGreaterThanOrEqual(row.serialStart);
      }
    }
  });

  it.each([
    ['IWC', IWC_SERIALS],
    ['Longines', LONGINES_SERIALS],
    ['UniversalGenève', UG_SERIALS],
  ])('%s: 구간이 서로 겹치지 않는다 — 겹치면 먼저 걸린 해가 이긴다', (_brand, table) => {
    const ranges = table
      .filter((r) => r.serialStart != null && r.serialEnd != null)
      .map((r) => [r.serialStart!, r.serialEnd!] as const)
      .sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ranges.length; i++) {
      expect(ranges[i][0]).toBeGreaterThan(ranges[i - 1][1]);
    }
  });

  /**
   * 롤렉스 표는 인접한 32쌍 중 30쌍이 경계 시리얼을 공유한다(1963 은 …~1000000, 1964 는
   * 1000000~…). 표 순서대로 먼저 걸린 해가 이기므로 경계값은 언제나 앞선 해로 나온다.
   * 리팩터링 전 코드도 같은 find 를 썼으니 동작이 달라진 것은 아니다. 자료 자체의 성질이라
   * 여기서 고치지 않고, 어느 쪽으로 갈리는지만 못박아 둔다.
   */
  it('Rolex: 경계 시리얼은 앞선 해로 판정된다', () => {
    expect(findYearInRanges(ROLEX_SERIALS, 1000000)).toBe(1963);
    expect(findYearInRanges(ROLEX_SERIALS, 999999)).toBe(1963);
    expect(findYearInRanges(ROLEX_SERIALS, 1000001)).toBe(1964);
  });

  it('Omega 표는 시리얼 오름차순이어야 한다 — findYearByThreshold 가 그것을 전제한다', () => {
    for (let i = 1; i < OMEGA_SERIALS.length; i++) {
      expect(OMEGA_SERIALS[i].serial).toBeGreaterThan(OMEGA_SERIALS[i - 1].serial);
    }
  });
});
