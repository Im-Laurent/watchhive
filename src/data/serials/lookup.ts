import type { OmegaSerial, RangeSerial } from '../types';
import { OMEGA_SERIALS } from './omega';
import { ROLEX_SERIALS } from './rolex';
import { IWC_SERIALS } from './iwc';
import { LONGINES_SERIALS } from './longines';
import { UG_SERIALS } from './ug';

/**
 * 시리얼 표에서 생산년도를 찾는다.
 *
 * Rolex · IWC · Longines · Universal Genève 는 모두 "구간 표"라 조회 코드가 같다. 예전에는
 * YearFinder 안에 브랜드마다 같은 find 가 네 벌 복사돼 있었다 — 표만 갈아 끼우면 되는 일이다.
 */

/** 구간 표: serialStart~serialEnd 안에 들면 그 해. */
export function findYearInRanges(table: RangeSerial[], serial: number): RangeSerial['year'] | null {
  if (!Number.isFinite(serial)) return null;
  const hit = table.find(
    (row) =>
      row.serialStart != null &&
      row.serialEnd != null &&
      serial >= row.serialStart &&
      serial <= row.serialEnd
  );
  return hit ? hit.year : null;
}

/**
 * 접두 문자 표: 구간 대신 문자로 구분되는 해(롤렉스 1987년의 'R')를 찾는다.
 * 예전에는 YearFinder 가 'R'과 '1987년'을 코드에 박아 두어, 표에 있는 serialPrefix 는 아무도
 * 읽지 않는 값이었다. 표를 유일한 출처로 삼는다.
 */
export function findYearByPrefix(table: RangeSerial[], serial: string): RangeSerial['year'] | null {
  const hit = table.find((row) => row.serialPrefix && serial.startsWith(row.serialPrefix));
  return hit ? hit.year : null;
}

/**
 * 문턱 표(오메가): 각 행이 "그 해가 시작되는 시리얼"이라 구간이 아니다.
 * 시리얼을 넘어서지 않는 마지막 해를 고른다. 표는 시리얼 오름차순이어야 한다.
 */
export function findYearByThreshold(table: OmegaSerial[], serial: number): number | null {
  if (!Number.isFinite(serial)) return null;
  let found: number | null = null;
  for (const row of table) {
    if (serial >= row.serial) found = row.year;
    else break;
  }
  return found;
}

/**
 * 구간 표를 쓰는 브랜드. Omega 만 표의 모양이 달라(구간이 아니라 그 해의 시작 시리얼) 따로 본다.
 * Rolex 1987년처럼 구간 대신 접두 문자로 구분되는 해는 표의 serialPrefix 가 갖고 있다.
 */
const RANGE_TABLES: Record<string, RangeSerial[]> = {
  Rolex: ROLEX_SERIALS,
  IWC: IWC_SERIALS,
  Longines: LONGINES_SERIALS,
  UniversalGenève: UG_SERIALS,
};

/** 입력에서 영숫자만 남기고 대문자로 맞춘다 (공백·하이픈을 넣어도 조회되도록). */
export function normalizeSerial(input: string): string {
  return input.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/** 정제된 시리얼로 생산년도 표기를 찾는다. 못 찾으면 null. */
export function lookupYear(brand: string, serial: string): string | null {
  if (brand === 'Omega') {
    const year = findYearByThreshold(OMEGA_SERIALS, parseInt(serial, 10));
    return year == null ? null : `${year}년`;
  }
  const table = RANGE_TABLES[brand];
  if (!table) return null;
  const year = findYearByPrefix(table, serial) ?? findYearInRanges(table, parseInt(serial, 10));
  return year == null ? null : `${year}년`;
}
