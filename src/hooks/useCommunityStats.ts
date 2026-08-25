import { useCallback, useEffect, useState } from 'react';
import { firebaseApp } from '../lib/firebase';

/** 로그인 없이 누구나 올리는 익명 누적 카운터. 문서 하나를 원자적으로 증가시킬 뿐이라 개인 기록은 남지 않는다. */
export type CommunityStats = { likes: number; measurements: number; shares: number };

type CounterField = keyof CommunityStats;

const STATS_COLLECTION = 'stats';
const STATS_DOC_ID = 'timegrapher';
const LIKED_STORAGE_KEY = 'timegrapher_liked';

// firebase/firestore는 이 앱에서 타임그래퍼 결과 화면 말고는 쓰지 않는데, 이 앱은 라우트 코드 분할을
// 하지 않아서 정적 import로 두면 모든 페이지의 초기 번들에 얹힌다. 동적 import로 별도 청크로 빼서
// 카운터가 실제로 필요한 순간에만 내려받는다.
type FirestoreModule = typeof import('firebase/firestore');
let firestorePromise: Promise<FirestoreModule> | null = null;

function loadFirestore(): Promise<FirestoreModule> {
  firestorePromise ??= import('firebase/firestore');
  return firestorePromise;
}

function readLikedFlag(): boolean {
  try {
    return localStorage.getItem(LIKED_STORAGE_KEY) === '1';
  } catch {
    // 시크릿 모드나 저장소 차단 환경에서는 접근 자체가 예외를 던진다. 좋아요는 부가 기능이라 그냥 허용 상태로 둔다.
    return false;
  }
}

/**
 * `stats/timegrapher` 문서를 실시간 구독하고, 좋아요/측정/공유를 각각 `increment(1)`로 올린다.
 * 카운터는 본 기능(측정·진단)과 무관한 부가 요소라, 읽기/쓰기가 실패해도 에러를 노출하지 않고
 * 조용히 숨긴다(`stats`가 null이면 호출부에서 카운트 UI를 감춘다).
 */
export function useCommunityStats() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [liked, setLiked] = useState(readLikedFlag);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    loadFirestore()
      .then((fs) => {
        if (cancelled) return;
        const ref = fs.doc(fs.getFirestore(firebaseApp), STATS_COLLECTION, STATS_DOC_ID);
        unsubscribe = fs.onSnapshot(
          ref,
          (snap) => {
            const data = snap.data();
            if (!data) return;
            setStats({
              likes: Number(data.likes ?? 0),
              measurements: Number(data.measurements ?? 0),
              shares: Number(data.shares ?? 0),
            });
          },
          () => setStats(null)
        );
      })
      .catch(() => setStats(null));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const bump = useCallback(async (field: CounterField) => {
    try {
      const fs = await loadFirestore();
      const ref = fs.doc(fs.getFirestore(firebaseApp), STATS_COLLECTION, STATS_DOC_ID);
      await fs.updateDoc(ref, { [field]: fs.increment(1) });
    } catch {
      // 실패해도 사용자가 할 수 있는 일이 없고 측정 결과와도 무관하므로 조용히 넘어간다.
    }
  }, []);

  // 완벽한 부정클릭 방지는 아니지만(시크릿 창이면 다시 가능), 실제 비용이 드는 AI 쿼터와 달리
  // 리스크가 낮아 localStorage 플래그로 소프트 잠금만 건다.
  const likeOnce = useCallback(() => {
    if (readLikedFlag()) return;
    setLiked(true);
    try {
      localStorage.setItem(LIKED_STORAGE_KEY, '1');
    } catch {
      // 저장하지 못해도 이번 세션 동안은 위 state로 버튼이 잠긴다.
    }
    void bump('likes');
  }, [bump]);

  const recordMeasurement = useCallback(() => void bump('measurements'), [bump]);
  const recordShare = useCallback(() => void bump('shares'), [bump]);

  return { stats, liked, likeOnce, recordMeasurement, recordShare };
}
