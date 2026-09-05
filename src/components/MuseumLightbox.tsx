import { useCallback, useEffect, useRef, useState } from 'react';
import type { MuseumPiece } from '../data/types';
import MuseumPager from './MuseumPager';
import MuseumPlate from './MuseumPlate';
import { isSwipe } from './museumGeometry';

const MIN = 1;
const MAX = 5;

type Props = {
  piece: MuseumPiece;
  startIndex: number;
  onClose: () => void;
};

/**
 * 확대 화면. 그림을 크게 띄우고 명제표를 그대로 옆에 세운다.
 *
 * 확대·이동은 마우스와 손가락을 **하나의 변환(translate + scale)** 으로 처리한다.
 * transform-origin 을 커서 위치로 옮기는 방식은 mousemove 에 의존해서 터치에서는
 * 아무 일도 일어나지 않는다 — 폰에서 확대할 방법이 없어지는 이유다.
 *
 * 변환값은 state 가 아니라 ref 에 둔다. 손가락을 끌 때마다 리렌더를 돌리면 버벅인다.
 */
export default function MuseumLightbox({ piece, startIndex, onClose }: Props) {
  const [index, setIndex] = useState(startIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const z = useRef({ sc: MIN, tx: 0, ty: 0, pinch0: 0, sc0: 1, panX: 0, panY: 0, moved: 0, lastTap: 0, startX: 0, startY: 0 });
  const pts = useRef(new Map<number, { x: number; y: number }>());

  const { shots } = piece;
  const shot = shots[index] ?? shots[0];

  const go = useCallback(
    (n: number) => setIndex(((n % shots.length) + shots.length) % shots.length),
    [shots.length],
  );

  const apply = useCallback(() => {
    const img = imgRef.current;
    const root = rootRef.current;
    if (!img || !root) return;
    const s = z.current;
    // 확대한 만큼만 움직일 수 있게 막는다. 안 그러면 그림이 화면 밖으로 날아간다.
    const mx = Math.max(0, ((s.sc - 1) * img.clientWidth) / 2);
    const my = Math.max(0, ((s.sc - 1) * img.clientHeight) / 2);
    s.tx = Math.min(mx, Math.max(-mx, s.tx));
    s.ty = Math.min(my, Math.max(-my, s.ty));
    img.style.transform = `translate(${s.tx}px, ${s.ty}px) scale(${s.sc})`;
    root.classList.toggle('is-zoomed', s.sc > 1.01);
  }, []);

  const reset = useCallback(() => {
    z.current.sc = MIN;
    z.current.tx = 0;
    z.current.ty = 0;
    if (imgRef.current) imgRef.current.style.transform = '';
    rootRef.current?.classList.remove('is-zoomed');
  }, []);

  /** 어떤 지점을 화면에 고정한 채 배율만 바꾼다 (핀치 중심, 더블탭 지점) */
  const zoomAt = useCallback((next: number, cx: number, cy: number) => {
    const img = imgRef.current;
    if (!img) return;
    const s = z.current;
    const target = Math.min(MAX, Math.max(MIN, next));
    const r = img.getBoundingClientRect();
    const ox = cx - (r.left + r.width / 2);
    const oy = cy - (r.top + r.height / 2);
    const k = target / s.sc;
    s.tx = s.tx * k - ox * (k - 1);
    s.ty = s.ty * k - oy * (k - 1);
    s.sc = target;
    apply();
  }, [apply]);

  // 사진을 넘기면 배율을 원래대로. 확대한 채 넘어가면 어디를 보고 있는지 알 수 없다.
  useEffect(() => { reset(); }, [index, reset]);

  // 열려 있는 동안 뒤 페이지는 스크롤되지 않는다
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(index - 1);
      else if (e.key === 'ArrowRight') go(index + 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, index, onClose]);

  // 휠은 네이티브로 붙인다 — React 의 onWheel 은 passive 라 preventDefault 가 안 먹는다.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(z.current.sc * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
    };
    img.addEventListener('wheel', onWheel, { passive: false });
    return () => img.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const mid = () => {
    const a = [...pts.current.values()];
    return {
      x: (a[0].x + a[1].x) / 2,
      y: (a[0].y + a[1].y) / 2,
      d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLImageElement>) => {
    const s = z.current;
    // 등록을 먼저 한다. setPointerCapture 가 던지면 그 아래가 통째로 날아간다.
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 무시 */ }
    s.moved = 0;
    if (pts.current.size === 2) {
      const m = mid();
      s.pinch0 = m.d;
      s.sc0 = s.sc;
    } else {
      s.panX = s.startX = e.clientX;
      s.panY = s.startY = e.clientY;
    }
    e.currentTarget.classList.add('is-dragging');
  };

  const onPointerMove = (e: React.PointerEvent<HTMLImageElement>) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = z.current;
    if (pts.current.size === 2) {
      const m = mid();
      if (s.pinch0 > 0) zoomAt(s.sc0 * (m.d / s.pinch0), m.x, m.y);
      s.moved = 99;
    } else {
      s.moved += Math.abs(e.clientX - s.panX) + Math.abs(e.clientY - s.panY);
      if (s.sc > 1.01) {
        s.tx += e.clientX - s.panX;
        s.ty += e.clientY - s.panY;
        apply();
      }
      s.panX = e.clientX;
      s.panY = e.clientY;
    }
  };

  const lift = (e: React.PointerEvent<HTMLImageElement>) => {
    pts.current.delete(e.pointerId);
    const s = z.current;
    if (pts.current.size < 2) s.pinch0 = 0;
    if (pts.current.size > 0) return;
    e.currentTarget.classList.remove('is-dragging');

    // 확대하지 않은 채 옆으로 밀면 다음 사진으로 넘어간다
    if (s.sc <= 1.01 && shots.length > 1) {
      const dir = isSwipe(s.startX, s.startY, e.clientX, e.clientY);
      if (dir) {
        go(index + dir);
        s.moved = 99;
      }
    }
    if (s.moved < 6) {
      // 탭/클릭 — 더블이면 원래대로, 아니면 그 지점을 파고들며 확대
      const now = Date.now();
      if (now - s.lastTap < 300) {
        reset();
        s.lastTap = 0;
      } else {
        s.lastTap = now;
        if (s.sc > 1.01) reset();
        else zoomAt(2.4, e.clientX, e.clientY);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className="wh-mu__lb"
      role="dialog"
      aria-modal="true"
      aria-label={`${piece.ko.title} 확대 보기`}
      // 그림 옆 빈 곳을 누르면 닫는다. 그림은 무대 안에 있어서 여기까지 올라오지 않는다.
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button type="button" className="wh-mu__x" aria-label="닫기" onClick={onClose} autoFocus>
        &times;
      </button>
      <div className="wh-mu__stage" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <picture>
          <source type="image/webp" srcSet={`${shot.src}.webp`} />
          <img
            ref={imgRef}
            className="wh-mu__lbimg"
            src={`${shot.src}.jpg`}
            alt={piece.alt}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={lift}
            onPointerCancel={lift}
          />
        </picture>
        <MuseumPager shots={shots} index={index} onGo={go} />
      </div>
      <MuseumPlate piece={piece} />
      <div className="wh-mu__hint">
        ← → 또는 좌우로 밀어 사진 전환 · 눌러서 확대 · 두 손가락으로 크기 조절 · 끌어서 이동 · Esc 로 닫기
      </div>
    </div>
  );
}
