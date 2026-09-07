import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import FitFinder from '../FitFinder';

function renderPage() {
  return render(
    <MemoryRouter>
      <FitFinder />
    </MemoryRouter>
  );
}

/** 손목 너비를 직접 입력하는 숫자 칸 */
const numberInput = () => screen.getByRole('spinbutton');

describe('FitFinder — 손목 너비 입력', () => {
  it('기본값 55mm 로 시작한다', () => {
    renderPage();
    expect(numberInput()).toHaveValue(55);
  });

  it('입력칸을 비워도 NaN 이 화면에 나오지 않는다', async () => {
    // parseInt('') 가 NaN 이고 Math.max/min 이 그대로 흘려보내 "NaN mm" 가 찍히던 자리다.
    const user = userEvent.setup();
    renderPage();
    await user.clear(numberInput());
    expect(numberInput()).toHaveValue(null); // 칸은 비어 있어도
    expect(screen.getByText('55')).toBeInTheDocument(); // 확정값은 그대로다
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('숫자가 아닌 입력에도 값이 남는다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.clear(numberInput());
    await user.type(numberInput(), 'abc');
    expect(document.body.textContent).not.toContain('NaN');
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  it('범위를 벗어난 값은 칸을 벗어날 때 안쪽으로 붙인다', () => {
    renderPage();
    fireEvent.change(numberInput(), { target: { value: '99' } });
    fireEvent.blur(numberInput());
    expect(numberInput()).toHaveValue(65);
    fireEvent.change(numberInput(), { target: { value: '10' } });
    fireEvent.blur(numberInput());
    expect(numberInput()).toHaveValue(40);
  });

  it('슬라이더는 언제나 범위 안의 값만 확정한다', () => {
    renderPage();
    fireEvent.change(screen.getByRole('slider'), { target: { value: '62' } });
    expect(numberInput()).toHaveValue(62);
  });

  it('칸을 비우고 두 자리 수를 쳐 넣을 수 있다', async () => {
    // 예전에는 한 글자마다 40~65 로 붙어서 5 → 40 → "400" → 65 로 끝났다.
    const user = userEvent.setup();
    renderPage();
    await user.clear(numberInput());
    await user.type(numberInput(), '50');
    expect(numberInput()).toHaveValue(50);
  });

  it('치는 도중의 숫자는 화면 값에 반영되지 않는다', async () => {
    // "5" 까지 친 시점은 아직 온전한 값이 아니다 — 40 으로 붙이지 않고 직전 값을 지킨다.
    const user = userEvent.setup();
    renderPage();
    await user.clear(numberInput());
    await user.type(numberInput(), '5');
    expect(numberInput()).toHaveValue(5);
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  it('범위 밖인 채로 칸을 벗어나면 그때 안쪽으로 붙인다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.clear(numberInput());
    await user.type(numberInput(), '5');
    await user.tab();
    expect(numberInput()).toHaveValue(40);
  });

  it('비운 채로 칸을 벗어나면 직전 값으로 되돌아간다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.clear(numberInput());
    await user.tab();
    expect(numberInput()).toHaveValue(55);
    expect(document.body.textContent).not.toContain('NaN');
  });

  it('두 자리를 다 치면 결과도 그 값으로 갱신된다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: '추천 사이즈 확인' }));
    await user.clear(numberInput());
    await user.type(numberInput(), '50');
    // 50mm 드레스 워치 → 30.0 ~ 35.0
    expect(screen.getByText('30.0mm ~ 35.0mm')).toBeInTheDocument();
  });
});

describe('FitFinder — 추천 결과', () => {
  // "추천 케이스 사이즈"라는 문구는 아래 참고 목록에도 있어서, 결과 패널은 계산된 값으로 찾는다.
  const recommendation = (text: string) => screen.queryByText(text);

  it('버튼을 누르기 전에는 결과가 없다', () => {
    renderPage();
    expect(recommendation('33.0mm ~ 38.5mm')).not.toBeInTheDocument();
  });

  it('버튼을 누르면 추천 케이스와 러그가 나온다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: '추천 사이즈 확인' }));
    // 55mm 드레스 워치 → 60~70% = 33.0 ~ 38.5, 러그는 85% = 46.8
    expect(recommendation('33.0mm ~ 38.5mm')).toBeInTheDocument();
    expect(recommendation('46.8mm')).toBeInTheDocument();
  });

  it('시계 종류를 바꾸면 결과도 따라 바뀐다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: '추천 사이즈 확인' }));
    await user.click(screen.getByRole('button', { name: /빅 사이즈/ }));
    // 55mm 빅 사이즈 → 75~80% = 41.3 ~ 44.0
    expect(recommendation('41.3mm ~ 44.0mm')).toBeInTheDocument();
    expect(recommendation('33.0mm ~ 38.5mm')).not.toBeInTheDocument();
  });

  it('결과가 나오기 전에는 종류만 바꿔도 결과가 생기지 않는다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /툴 워치/ }));
    expect(recommendation('34.0mm ~ 36.0mm')).not.toBeInTheDocument();
  });

  it('손목 너비를 바꾸면 이미 나온 결과가 따라 갱신된다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: '추천 사이즈 확인' }));
    fireEvent.change(numberInput(), { target: { value: '50' } });
    // 50mm 드레스 워치 → 30.0 ~ 35.0
    expect(recommendation('30.0mm ~ 35.0mm')).toBeInTheDocument();
    expect(recommendation('33.0mm ~ 38.5mm')).not.toBeInTheDocument();
  });

  it('슬라이더로 바꿔도 결과가 따라온다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: '추천 사이즈 확인' }));
    fireEvent.change(screen.getByRole('slider'), { target: { value: '60' } });
    // 60mm 드레스 워치 → 36.0 ~ 42.0
    expect(recommendation('36.0mm ~ 42.0mm')).toBeInTheDocument();
  });
});

describe('FitFinder — 손목 대비 케이스 그림', () => {
  /** 결과를 띄우고 SVG 의 기하를 읽어 온다. */
  function diagram(type?: RegExp, wrist?: number) {
    renderPage();
    if (type) fireEvent.click(screen.getByRole('button', { name: type }));
    if (wrist != null) fireEvent.change(screen.getByRole('slider'), { target: { value: String(wrist) } });
    fireEvent.click(screen.getByRole('button', { name: '추천 사이즈 확인' }));

    const svg = document.querySelector('svg[viewBox]') as SVGSVGElement;
    const [, , viewW, viewH] = svg.getAttribute('viewBox')!.split(' ').map(Number);
    const circle = svg.querySelector('circle')!;
    const cy = Number(circle.getAttribute('cy'));
    const r = Number(circle.getAttribute('r'));
    const texts = [...svg.querySelectorAll('text')].map((t) => ({
      y: Number(t.getAttribute('y')),
      text: t.textContent ?? '',
    }));
    return { viewW, viewH, cy, r, texts, svg };
  }

  it('원이 viewBox 안에 온전히 들어간다 — 예전에는 아래가 잘려 반원처럼 보였다', () => {
    const d = diagram();
    expect(d.cy - d.r).toBeGreaterThanOrEqual(0);
    expect(d.cy + d.r).toBeLessThanOrEqual(d.viewH);
  });

  it('글자가 원에 가리지 않는다 — 예전에는 "손목 단면" 이 통째로 덮였다', () => {
    const d = diagram();
    const top = d.cy - d.r;
    const bottom = d.cy + d.r;
    d.texts.forEach((t) => {
      expect(t.y < top || t.y > bottom).toBe(true);
    });
  });

  it('글자를 원보다 나중에 그린다 — SVG 는 나중에 그린 것이 위로 온다', () => {
    const d = diagram();
    const kinds = [...d.svg.children].map((el) => el.tagName.toLowerCase());
    expect(kinds.lastIndexOf('circle')).toBeLessThan(kinds.indexOf('text'));
  });

  it.each([
    [/드레스 워치/, 40], [/드레스 워치/, 55], [/드레스 워치/, 65],
    [/툴 워치/, 40], [/툴 워치/, 55], [/툴 워치/, 65],
    [/빅 사이즈/, 40], [/빅 사이즈/, 55], [/빅 사이즈/, 65],
  ])('%s · 손목 %imm 에서도 잘리거나 겹치지 않는다', (type, wrist) => {
    const d = diagram(type, wrist);
    expect(d.cy - d.r).toBeGreaterThanOrEqual(0);
    expect(d.cy + d.r).toBeLessThanOrEqual(d.viewH);
    d.texts.forEach((t) => expect(t.y < d.cy - d.r || t.y > d.cy + d.r).toBe(true));
  });

  it('두 글자가 각각 케이스와 손목을 가리킨다', () => {
    const d = diagram(undefined, 55);
    expect(d.texts.some((t) => t.text.includes('케이스'))).toBe(true);
    expect(d.texts.some((t) => t.text.includes('손목 단면'))).toBe(true);
  });

  it('케이스가 손목보다 클 수 없다 — 원이 막대를 넘지 않는다', () => {
    const d = diagram(/빅 사이즈/, 65);
    expect(d.r * 2).toBeLessThanOrEqual(260);
  });
});
