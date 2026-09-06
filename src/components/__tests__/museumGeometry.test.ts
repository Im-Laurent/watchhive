import { describe, expect, it } from 'vitest';
import { drawnRect, isSwipe, wrapIndex } from '../museumGeometry';

describe('wrapIndex', () => {
  it('범위 안이면 그대로', () => {
    expect(wrapIndex(1, 4)).toBe(1);
  });

  it('마지막 다음은 처음', () => {
    expect(wrapIndex(4, 4)).toBe(0);
  });

  it('처음 이전은 마지막', () => {
    expect(wrapIndex(-1, 4)).toBe(3);
  });

  it('여러 바퀴를 돌아도 범위 안', () => {
    expect(wrapIndex(9, 4)).toBe(1);
    expect(wrapIndex(-9, 4)).toBe(3);
  });

  it('사진이 한 장이면 언제나 0', () => {
    expect(wrapIndex(5, 1)).toBe(0);
    expect(wrapIndex(-5, 1)).toBe(0);
  });
});

describe('isSwipe', () => {
  it('오른쪽에서 왼쪽으로 밀면 다음(1)', () => {
    expect(isSwipe(200, 100, 100, 100)).toBe(1);
  });

  it('왼쪽에서 오른쪽으로 밀면 이전(-1)', () => {
    expect(isSwipe(100, 100, 200, 100)).toBe(-1);
  });

  it('짧게 움직인 것은 밀기가 아니다 — 눌러서 확대하려던 손짓이다', () => {
    expect(isSwipe(100, 100, 130, 100)).toBe(0);
    expect(isSwipe(100, 100, 145, 100)).toBe(0);
  });

  it('세로로 밀면 반응하지 않는다 — 페이지를 훑는 손짓이다', () => {
    expect(isSwipe(100, 100, 160, 300)).toBe(0);
  });

  it('비스듬해도 가로가 충분히 우세하면 인정한다', () => {
    expect(isSwipe(300, 100, 100, 120)).toBe(1);
  });

  it('제자리는 0', () => {
    expect(isSwipe(100, 100, 100, 100)).toBe(0);
  });
});

describe('drawnRect', () => {
  function fakeImg(box: DOMRect, naturalWidth: number, naturalHeight: number): HTMLImageElement {
    return {
      getBoundingClientRect: () => box,
      naturalWidth,
      naturalHeight,
    } as unknown as HTMLImageElement;
  }

  const box = { left: 0, top: 0, width: 400, height: 200 } as DOMRect;

  it('아직 안 읽힌 사진은 상자를 그대로 쓴다', () => {
    expect(drawnRect(fakeImg(box, 0, 0))).toBe(box);
  });

  it('정사각 사진은 좌우에 여백이 생긴다 — contain 이 짧은 쪽에 맞춘다', () => {
    const r = drawnRect(fakeImg(box, 1000, 1000));
    expect(r.width).toBe(200);
    expect(r.height).toBe(200);
    expect(r.left).toBe(100); // (400 - 200) / 2
    expect(r.top).toBe(0);
  });

  it('상자와 비율이 같으면 상자를 꽉 채운다', () => {
    const r = drawnRect(fakeImg(box, 800, 400));
    expect(r.width).toBe(400);
    expect(r.height).toBe(200);
    expect(r.left).toBe(0);
    expect(r.top).toBe(0);
  });

  it('가로로 더 긴 사진은 위아래에 여백이 생긴다', () => {
    const r = drawnRect(fakeImg(box, 1000, 250));
    expect(r.width).toBe(400);
    expect(r.height).toBe(100);
    expect(r.top).toBe(50);
  });

  it('상자가 화면 안쪽에 있어도 좌표를 더해 준다', () => {
    const offset = { left: 30, top: 70, width: 400, height: 200 } as DOMRect;
    const r = drawnRect(fakeImg(offset, 1000, 1000));
    expect(r.left).toBe(130);
    expect(r.top).toBe(70);
  });
});
