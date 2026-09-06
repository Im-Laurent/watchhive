import { describe, expect, it } from 'vitest';
import { caliberSpan, decodeMonth, decodeSeikoSerial, SEIKO_ERA_START } from '../seikoLookup';
import { SEIKO_CALIBERS } from '../../seikoCalibers';

const THIS_YEAR = 2026;

describe('decodeMonth', () => {
  it.each([['1', 1], ['5', 5], ['9', 9]])('숫자 %s 는 %i월', (ch, n) => {
    expect(decodeMonth(ch)).toEqual({ n, label: `${n}월` });
  });

  it.each([['O', 10], ['N', 11], ['D', 12]])('문자 %s 는 %i월', (ch, n) => {
    expect(decodeMonth(ch)?.n).toBe(n);
  });

  it('0 은 월이 아니다', () => {
    expect(decodeMonth('0')).toBeNull();
  });

  it('다른 문자는 월이 아니다', () => {
    expect(decodeMonth('X')).toBeNull();
    expect(decodeMonth('')).toBeNull();
  });
});

describe('caliberSpan', () => {
  it('끝이 있으면 두 해를 잇는다', () => {
    expect(caliberSpan([1966, 1978])).toBe('1966~1978');
  });

  it('끝이 없으면 현재까지', () => {
    expect(caliberSpan([1996, null])).toBe('1996~현재');
  });
});

describe('decodeSeikoSerial — 입력 검증', () => {
  it.each(['12345', '123456789'])('%s 는 자릿수 오류', (serial) => {
    expect(decodeSeikoSerial(serial, '', THIS_YEAR)).toEqual({ kind: 'error', error: 'length' });
  });

  it('6자리와 7자리는 통과한다', () => {
    expect(decodeSeikoSerial('7N0326', '', THIS_YEAR).kind).not.toBe('error');
    expect(decodeSeikoSerial('7N03267', '', THIS_YEAR).kind).not.toBe('error');
  });

  it('첫 자리가 문자면 연도 오류', () => {
    expect(decodeSeikoSerial('AN0326', '', THIS_YEAR)).toEqual({ kind: 'error', error: 'year' });
  });

  it('둘째 자리가 월이 아니면 월 오류', () => {
    expect(decodeSeikoSerial('7X0326', '', THIS_YEAR)).toEqual({ kind: 'error', error: 'month' });
  });

  it('둘째 자리 0 도 월 오류', () => {
    expect(decodeSeikoSerial('700326', '', THIS_YEAR)).toEqual({ kind: 'error', error: 'month' });
  });
});

describe('decodeSeikoSerial — 칼리버 없이', () => {
  const result = decodeSeikoSerial('7N0326', '', THIS_YEAR);

  it('끝자리가 같은 해를 모두 후보로 낸다', () => {
    expect(result.kind).toBe('multi');
    if (result.kind !== 'multi') return;
    expect(result.candidates).toEqual([1967, 1977, 1987, 1997, 2007, 2017]);
    expect(result.reasonKind).toBe('noCal');
  });

  it('월과 생산 일련번호를 갈라 낸다', () => {
    if (result.kind !== 'multi') return;
    expect(result.monthLabel).toBe('11월');
    expect(result.prod).toBe('0326');
    expect(result.lastDigit).toBe(7);
  });

  it('후보는 세이코 시대 시작 이후만 나온다', () => {
    if (result.kind !== 'multi') return;
    result.candidates.forEach((y) => expect(y).toBeGreaterThanOrEqual(SEIKO_ERA_START));
  });
});

describe('decodeSeikoSerial — 칼리버로 좁히기', () => {
  it('한 해로 좁혀지면 single', () => {
    // 0531 은 1977~1987 — 끝자리 8 은 1978 하나뿐(1988 은 범위 밖)
    const range = SEIKO_CALIBERS['0531'];
    expect(range).toEqual([1977, 1987]);
    const result = decodeSeikoSerial('8N0326', '0531', THIS_YEAR);
    expect(result.kind).toBe('single');
    if (result.kind !== 'single') return;
    expect(result.year).toBe(1978);
    expect(result.caliber).toBe('0531');
    expect(result.range).toEqual(range);
  });

  it('칼리버 범위 밖 끝자리는 후보가 아예 없을 수도 있다', () => {
    // 0531(1977~1987) 에 끝자리 3 → 1983 하나. 범위가 좁으면 후보도 줄어든다.
    const result = decodeSeikoSerial('3N0326', '0531', THIS_YEAR);
    expect(result.kind).toBe('single');
    if (result.kind !== 'single') return;
    expect(result.year).toBe(1983);
  });

  it('생산 기간이 10년이면 같은 끝자리가 둘 남아 wide 가 된다', () => {
    // 1977~1987 은 양 끝이 같은 끝자리(7) — 1977 과 1987 둘 다 후보다.
    const result = decodeSeikoSerial('7N0326', '0531', THIS_YEAR);
    expect(result.kind).toBe('multi');
    if (result.kind !== 'multi') return;
    expect(result.candidates).toEqual([1977, 1987]);
    expect(result.reasonKind).toBe('wide');
  });

  it('자료에 없는 칼리버는 notFound 로 표시하고 시리얼만으로 후보를 낸다', () => {
    const result = decodeSeikoSerial('7N0326', 'ZZZZ', THIS_YEAR);
    expect(result.kind).toBe('multi');
    if (result.kind !== 'multi') return;
    expect(result.reasonKind).toBe('notFound');
    expect(result.candidates.length).toBeGreaterThan(1);
  });

  it('10년 넘게 생산된 칼리버는 wide 로 표시한다', () => {
    // 생산 기간이 10년을 넘겨 끝자리가 같은 해가 둘 이상 남는 칼리버를 찾는다
    const wide = Object.entries(SEIKO_CALIBERS).find(([, [from, to]]) => (to ?? THIS_YEAR) - from >= 11);
    expect(wide).toBeDefined();
    const [caliber, [from]] = wide!;
    const result = decodeSeikoSerial(`${from % 10}N0326`, caliber, THIS_YEAR);
    expect(result.kind).toBe('multi');
    if (result.kind !== 'multi') return;
    expect(result.reasonKind).toBe('wide');
  });

  it('끝이 열린 칼리버는 올해까지 후보로 본다', () => {
    const open = Object.entries(SEIKO_CALIBERS).find(([, [, to]]) => to === null);
    expect(open).toBeDefined();
    const [caliber] = open!;
    const result = decodeSeikoSerial(`${THIS_YEAR % 10}N0326`, caliber, THIS_YEAR);
    if (result.kind === 'single') expect(result.year).toBe(THIS_YEAR);
    else if (result.kind === 'multi') expect(result.candidates).toContain(THIS_YEAR);
  });
});

describe('decodeSeikoSerial — 연도 상한', () => {
  it('올해가 후보에서 빠지지 않는다 — 예전에는 2026 이 코드에 박혀 있었다', () => {
    const result = decodeSeikoSerial(`${2030 % 10}N0326`, '', 2030);
    expect(result.kind).toBe('multi');
    if (result.kind !== 'multi') return;
    expect(result.candidates).toContain(2030);
  });

  it('아직 오지 않은 해는 후보에 없다', () => {
    const result = decodeSeikoSerial('7N0326', '', 2026);
    if (result.kind !== 'multi') return;
    expect(result.candidates).not.toContain(2027);
    expect(Math.max(...result.candidates)).toBeLessThanOrEqual(2026);
  });

  it('기본값은 오늘 연도', () => {
    const now = new Date().getFullYear();
    const result = decodeSeikoSerial(`${now % 10}N0326`, '');
    if (result.kind !== 'multi') return;
    expect(result.candidates).toContain(now);
  });
});
