/** 액자와 확대 화면이 함께 쓰는 좌표 계산. */

export type Rect = { left: number; top: number; width: number; height: number };

/**
 * 그림이 실제로 그려지는 자리. `<img>` 상자와 다를 수 있다.
 *
 * 액자 칸은 전체샷의 종횡비로 고정돼 있는데(넘길 때 페이지가 튀지 않도록) 확대샷과
 * 시계샷은 정사각이다. `object-fit: contain` 이 그 차이를 위아래 또는 좌우 여백으로
 * 흘려 보내므로, 2·3번째 사진에서는 상자 안에 매트가 드러난다.
 * 루페는 **그려진 자리**를 기준으로 잡아야 한다 — 상자 크기로 잡으면 정사각 사진이
 * 상자 비율로 늘어나 찌그러진다.
 */
export function drawnRect(el: HTMLImageElement): Rect {
  const r = el.getBoundingClientRect();
  const { naturalWidth: nw, naturalHeight: nh } = el;
  if (!nw || !nh) return r;                       // 아직 안 읽혔으면 상자를 쓴다
  const k = Math.min(r.width / nw, r.height / nh); // contain = 짧은 쪽에 맞춘다
  const w = nw * k;
  const h = nh * k;
  return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h };
}

/** 좌우로 민 손짓인가. 다음(1)·이전(-1), 아니면 0. */
export function isSwipe(x0: number, y0: number, x1: number, y1: number): -1 | 0 | 1 {
  const dx = x1 - x0;
  const dy = y1 - y0;
  // 세로로 밀 때는 반응하지 않는다 — 페이지를 훑는 손짓과 헷갈리지 않도록.
  if (Math.abs(dx) <= 45 || Math.abs(dx) <= Math.abs(dy) * 1.4) return 0;
  return dx < 0 ? 1 : -1;
}
