import { useEffect, useRef, useState } from 'react';
import { isPullToRefreshLocked } from '../lib/pullToRefreshLock';

/** 이만큼 끌어야 새로고침된다 */
const THRESHOLD_PX = 70;
/** 표시가 더는 내려가지 않는 한계 */
const MAX_PULL_PX = 110;
/** 손가락 이동 대비 실제로 내려오는 비율 — 그대로 따라오면 너무 쉽게 넘어간다 */
const RESISTANCE = 0.5;

/**
 * 모바일에서 화면 맨 위를 아래로 당기면 새로고침한다.
 *
 * 브라우저 기본 당겨서 새로고침은 홈 화면에 추가한 PWA(manifest의 display:standalone)에서는
 * 동작하지 않는다. 그래서 직접 구현하고, 브라우저 기본 동작과 표시가 겹치지 않도록
 * index.css에서 overscroll-behavior-y로 기본 동작을 끈다.
 */
export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // 터치 핸들러는 한 번만 등록하므로, 안에서 읽는 값은 state가 아니라 ref로 본다.
  const startYRef = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshingRef = useRef(false);

  useEffect(() => {
    // 터치가 없는 환경(데스크톱)에는 브라우저 새로고침이 있으니 이 제스처를 두지 않는다.
    if (!('ontouchstart' in window)) return;

    const setPullBoth = (value: number) => {
      pullRef.current = value;
      setPull(value);
    };

    const onStart = (e: TouchEvent) => {
      if (refreshingRef.current || isPullToRefreshLocked()) return;
      // 맨 위에 있을 때만 시작한다 — 중간에서 당기면 그냥 스크롤이어야 한다.
      if (window.scrollY > 0 || e.touches.length !== 1) return;
      startYRef.current = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) {
        // 위로 올리면 평범한 스크롤이므로 제스처를 놓아준다.
        startYRef.current = null;
        setPullBoth(0);
        return;
      }
      if (e.cancelable) e.preventDefault();
      setPullBoth(Math.min(MAX_PULL_PX, delta * RESISTANCE));
    };

    const onEnd = () => {
      if (startYRef.current === null) return;
      startYRef.current = null;
      if (pullRef.current >= THRESHOLD_PX) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullBoth(THRESHOLD_PX);
        window.location.reload();
        return;
      }
      setPullBoth(0);
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const armed = pull >= THRESHOLD_PX;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center"
      style={{
        transform: `translateY(${pull - 46}px)`,
        opacity: pull > 4 ? 1 : 0,
        // 손가락을 따라 움직이는 동안에는 전환을 걸지 않아야 지연 없이 붙어 온다.
        transition: pull === 0 ? 'transform 200ms ease-out, opacity 200ms ease-out' : 'none',
      }}
      aria-hidden={pull === 0}
    >
      <div className="mt-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-md">
        <svg
          className={refreshing ? 'tg-spin' : undefined}
          style={refreshing ? undefined : { transform: `rotate(${(pull / THRESHOLD_PX) * 270}deg)` }}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={armed || refreshing ? '#1f2937' : '#9ca3af'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
      </div>
    </div>
  );
}
