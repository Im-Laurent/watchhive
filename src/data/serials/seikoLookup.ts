import { SEIKO_CALIBERS, type SeikoCaliberRange } from '../seikoCalibers';

/**
 * 세이코 시리얼 해독. 화면(SeikoYearFinder)에서 떼어내 값만 따로 검증할 수 있게 둔다.
 *
 * 세이코 시리얼은 연도의 **끝자리** 하나만 담고 있어 1972·1982·1992 를 가릴 수 없다.
 * 칼리버의 생산 시기를 겹쳐 봐야 대부분 한 해로 좁혀진다.
 */

/** 세이코가 이 방식을 쓰기 시작한 해 */
export const SEIKO_ERA_START = 1966;

export type SeikoDecodeError =
  | 'length'   // 6~7자리가 아님
  | 'year'     // 첫 자리가 숫자가 아님
  | 'month';   // 둘째 자리가 월이 아님

export type MultiReason =
  | 'noCal'    // 칼리버를 안 넣었다
  | 'notFound' // 넣었지만 연도 자료가 없다
  | 'wide';    // 그 칼리버가 10년 이상 생산됐다

export type SeikoResult =
  | { kind: 'error'; error: SeikoDecodeError }
  | {
      kind: 'single';
      year: number;
      month: number;
      monthLabel: string;
      prod: string;
      caliber: string;
      range: SeikoCaliberRange;
    }
  | {
      kind: 'multi';
      month: number;
      monthLabel: string;
      lastDigit: number;
      prod: string;
      candidates: number[];
      reasonKind: MultiReason;
      caliber: string;
      range?: SeikoCaliberRange;
    };

/**
 * 둘째 자리는 월이다. 10·11·12월은 두 자리를 쓸 수 없어 O·N·D 로 적는다
 * (October · November · December).
 */
export function decodeMonth(ch: string): { n: number; label: string } | null {
  if (ch >= '1' && ch <= '9') return { n: +ch, label: `${+ch}월` };
  if (ch === 'O') return { n: 10, label: '10월' };
  if (ch === 'N') return { n: 11, label: '11월' };
  if (ch === 'D') return { n: 12, label: '12월' };
  return null;
}

/** 칼리버 생산 기간을 "1966~1978" 또는 "1966~현재" 로 적는다. */
export function caliberSpan(range: SeikoCaliberRange): string {
  return `${range[0]}${range[1] ? `~${range[1]}` : '~현재'}`;
}

/**
 * 시리얼(과 있으면 칼리버)로 생산년도를 좁힌다.
 *
 * @param currentYear 후보를 끊는 위쪽 끝. 기본값은 오늘 연도 — 예전에는 2026 이 코드에
 *   박혀 있어 해가 바뀌면 그해 시계가 후보에서 빠졌다.
 */
export function decodeSeikoSerial(
  rawSerial: string,
  rawCaliber: string,
  currentYear: number = new Date().getFullYear()
): SeikoResult {
  if (rawSerial.length < 6 || rawSerial.length > 7) return { kind: 'error', error: 'length' };

  const yearChar = rawSerial[0];
  if (yearChar < '0' || yearChar > '9') return { kind: 'error', error: 'year' };

  const month = decodeMonth(rawSerial[1]);
  if (!month) return { kind: 'error', error: 'month' };

  const lastDigit = +yearChar;
  const prod = rawSerial.slice(2);
  const caliberGiven = rawCaliber.length > 0;
  const range = caliberGiven ? SEIKO_CALIBERS[rawCaliber] : undefined;

  // 끝자리가 맞는 해를 세이코 시대 전체에서 긁어모은 뒤, 칼리버 생산 기간으로 잘라낸다.
  let candidates: number[] = [];
  for (let year = SEIKO_ERA_START; year <= currentYear; year++) {
    if (year % 10 === lastDigit) candidates.push(year);
  }
  if (range) {
    const [from, to] = range;
    const until = to ?? currentYear;
    candidates = candidates.filter((year) => year >= from && year <= until);
  }

  if (range && candidates.length === 1) {
    return {
      kind: 'single',
      year: candidates[0],
      month: month.n,
      monthLabel: month.label,
      prod,
      caliber: rawCaliber,
      range,
    };
  }

  const reasonKind: MultiReason = !caliberGiven ? 'noCal' : !range ? 'notFound' : 'wide';
  return {
    kind: 'multi',
    month: month.n,
    monthLabel: month.label,
    lastDigit,
    prod,
    candidates,
    reasonKind,
    caliber: rawCaliber,
    range,
  };
}
