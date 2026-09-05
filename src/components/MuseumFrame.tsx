import { useCallback, useRef, useState } from 'react';
import type { MuseumPiece } from '../data/types';
import MuseumPager from './MuseumPager';
import MuseumPlate from './MuseumPlate';
import { drawnRect, isSwipe } from './museumGeometry';

const LOUPE_Z = 2.6;   // 루페 배율
const LOUPE_R = 95;    // 루페 반지름(px)

type Props = {
  piece: MuseumPiece;
  onOpen: (piece: MuseumPiece, index: number) => void;
};

/**
 * 액자 한 벌 — 금테·매트·핀조명·명제표, 그리고 그 자리에서 바로 넘기는 사진 세 장.
 *
 * 사진 칸(.wh-mu__shots)은 **전체샷의 종횡비로 크기를 못박는다.** 정사각 확대샷과
 * 시계샷은 그 안에서 여백을 두고 들어앉는다 — 칸이 사진마다 늘었다 줄었다 하면
 * 한 장 넘길 때마다 페이지가 위아래로 튄다.
 */
export default function MuseumFrame({ piece, onOpen }: Props) {
  const [index, setIndex] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const swipedAt = useRef(0);
  const warmed = useRef(false);

  const { shots } = piece;
  const shot = shots[index] ?? shots[0];
  const full = shots[0];

  const go = useCallback(
    (n: number) => setIndex(((n % shots.length) + shots.length) % shots.length),
    [shots.length],
  );

  /** 나머지 사진은 손이 닿을 때 받아 둔다. 처음부터 다 받으면 지연 로딩이 무의미해진다. */
  const warm = () => {
    if (warmed.current || shots.length < 2) return;
    warmed.current = true;
    shots.slice(1).forEach((s) => {
      new Image().src = `${s.src}.webp`;
    });
  };

  // ── 루페 ──────────────────────────────────────────────
  // 좌표는 <img> 상자가 아니라 **그림이 실제로 그려지는 자리**를 기준으로 잡는다.
  // 상자 크기를 쓰면 정사각 사진이 칸 비율로 늘어나 찌그러진다.
  const onMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = imgRef.current;
    const lens = lensRef.current;
    if (!img || !lens) return;
    const r = drawnRect(img);
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > r.width || y > r.height) {
      lens.classList.remove('is-on');
      return;
    }
    const host = lens.offsetParent?.getBoundingClientRect();
    if (!host) return;
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lens.style.backgroundSize = `${r.width * LOUPE_Z}px ${r.height * LOUPE_Z}px`;
    lens.style.backgroundPosition = `${-(x * LOUPE_Z - LOUPE_R)}px ${-(y * LOUPE_Z - LOUPE_R)}px`;
    lens.style.transform =
      `translate(${e.clientX - host.left - LOUPE_R}px, ${e.clientY - host.top - LOUPE_R}px)`;
    lens.classList.add('is-on');
  };

  // ── 좌우로 밀어 넘기기 ────────────────────────────────
  // 민 직후의 click 은 삼킨다. 안 그러면 한 장 넘기려다 확대 화면이 같이 열린다.
  const onPointerDown = (e: React.PointerEvent) => {
    warm();
    down.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const from = down.current;
    down.current = null;
    if (!from || shots.length < 2) return;
    const dir = isSwipe(from.x, from.y, e.clientX, e.clientY);
    if (dir) {
      swipedAt.current = Date.now();
      go(index + dir);
    }
  };
  const open = () => {
    if (Date.now() - swipedAt.current < 300) return;
    onOpen(piece, index);
  };

  return (
    <section className="wh-mu__bay" id={piece.id}>
      <div className="wh-mu__pool" />
      <div className="wh-mu__beam" />
      <div className="wh-mu__inner">
        <figure className="wh-mu__piece">
          <div className="wh-mu__frame">
            <div className="wh-mu__mat">
              <div
                className="wh-mu__shots"
                style={
                  {
                    '--ar': `${full.w}/${full.h}`,
                    '--arn': (full.w / full.h).toFixed(4),
                  } as React.CSSProperties
                }
              >
                <picture>
                  <source type="image/webp" srcSet={`${shot.src}.webp`} />
                  <img
                    ref={imgRef}
                    className="wh-mu__art"
                    src={`${shot.src}.jpg`}
                    alt={piece.alt}
                    loading="lazy"
                    decoding="async"
                    tabIndex={0}
                    role="button"
                    aria-label={`${piece.alt} — 눌러서 크게 보기`}
                    onMouseMove={onMouseMove}
                    onMouseLeave={() => lensRef.current?.classList.remove('is-on')}
                    onPointerEnter={warm}
                    onPointerDown={onPointerDown}
                    onPointerUp={onPointerUp}
                    onClick={open}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpen(piece, index);
                      }
                    }}
                  />
                </picture>
              </div>
              <div ref={lensRef} className="wh-mu__loupe" />
            </div>
          </div>
          <MuseumPager shots={shots} index={index} onGo={go} />
        </figure>
        <MuseumPlate piece={piece} />
      </div>
    </section>
  );
}
