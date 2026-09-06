import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KoreanYearNews from '../KoreanYearNews';
import { KOREAN_EVENTS } from '../../data/koreanEvents';

const SOME_YEAR = Number(Object.keys(KOREAN_EVENTS)[0]);

describe('KoreanYearNews', () => {
  it('자료가 있는 해는 사건 목록을 보여준다', () => {
    render(<KoreanYearNews year={SOME_YEAR} />);
    expect(screen.getByText(`| ${SOME_YEAR}년 대한민국`)).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBe(KOREAN_EVENTS[SOME_YEAR].events.length);
  });

  it('자료 범위 밖이면 아무것도 그리지 않는다', () => {
    const { container } = render(<KoreanYearNews year={1700} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('미래 연도도 조용히 넘어간다', () => {
    const { container } = render(<KoreanYearNews year={2999} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('시대 배지는 자료에 있을 때만 붙인다', () => {
    const withEra = Object.entries(KOREAN_EVENTS).find(([, v]) => v.era);
    if (!withEra) return;
    const [year, entry] = withEra;
    render(<KoreanYearNews year={Number(year)} />);
    expect(screen.getByText(entry.era!)).toBeInTheDocument();
  });
});
