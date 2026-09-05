import { useEffect, useRef, useState } from 'react';
import PageHead from '../components/PageHead';
import MuseumFrame from '../components/MuseumFrame';
import MuseumLightbox from '../components/MuseumLightbox';
import { useMuseum } from '../hooks/useMuseum';
import { useShare } from '../hooks/useShare';
import { PAGE_META } from '../data/pageMeta';
import type { MuseumPiece } from '../data/types';

export default function Museum() {
  const { pieces } = useMuseum();
  const { handleShare, shareMessage } = useShare();
  const [open, setOpen] = useState<{ piece: MuseumPiece; index: number } | null>(null);
  const roomRef = useRef<HTMLElement>(null);

  // 스크롤로 들어올 때 조명이 켜진다. 한 번 켜지면 다시 끄지 않는다 —
  // 오르내릴 때마다 깜빡이면 전시장이 아니라 나이트클럽이 된다.
  //
  // IntersectionObserver 대신 스크롤 위치를 직접 본다. 액자 높이가 지연 로딩에 따라
  // 크게 변해서 관찰자의 기하 정보가 어긋나는 경우가 있었다. 클래스만 붙였다 마는
  // 표시용 처리라 state 로 올리지 않는다 — 8개 액자 때문에 스크롤마다 리렌더할 일이 아니다.
  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    let bays = Array.from(room.querySelectorAll<HTMLElement>('.wh-mu__bay'));
    if (!bays.length) return;
    let ticking = false;

    const check = () => {
      ticking = false;
      const vh = window.innerHeight;
      bays = bays.filter((b) => {
        const r = b.getBoundingClientRect();
        // 액자가 화면 아래 90% 선 위로 올라왔고 아직 위로 빠져나가지 않았으면 켠다
        if (r.top < vh * 0.9 && r.bottom > vh * 0.1) {
          b.classList.add('is-lit');
          return false;
        }
        return true;
      });
      if (!bays.length) window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(check);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // 스크롤 이벤트에만 기대면, 브라우저가 이전 위치를 복원한 채로 열렸을 때 아무 일도
    // 일어나지 않아 그 자리의 액자가 영영 어두운 채로 남는다.
    const imgs = Array.from(room.querySelectorAll('img'));
    imgs.forEach((im) => im.addEventListener('load', onScroll));
    const timers = [0, 120, 500, 1500].map((t) => window.setTimeout(check, t));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      imgs.forEach((im) => im.removeEventListener('load', onScroll));
      timers.forEach(clearTimeout);
    };
  }, [pieces]);

  return (
    <>
      <PageHead {...PAGE_META.museum} />
      <main ref={roomRef} className="wh-mu">
        <header className="wh-mu__head">
          <h1 className="wh-mu__title">
            이 광활한 우주에서
            <br />
            마지막 남은 한 점
          </h1>
          <p className="wh-mu__sub">예술품 간의 만남</p>
        </header>

        {pieces.map((piece) => (
          <MuseumFrame
            key={piece.id}
            piece={piece}
            onOpen={(p, index) => setOpen({ piece: p, index })}
          />
        ))}

        <footer className="wh-mu__foot">
          걸린 작품 {pieces.length}점
          <br />
          모든 이미지는 AI 합성물이며 실제 작품이 아닙니다.
          <br />
          원본 출처와 라이선스는 각 명제표에 표기했습니다.
        </footer>
      </main>

      {/* 다른 페이지와 같은 구독·공유 영역. 전시실이 끝나면 사이트의 밝은 바탕으로
          돌아오므로 색을 바꾸지 않고 있는 그대로 쓴다 — 어두운 방 안에 넣으면
          text-gray-700 이 배경에 묻힌다. */}
      <section className="container mx-auto p-8 text-center">
        <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
        <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
          <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noreferrer" className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">YouTube 채널 구독하기</a>
          <button onClick={() => handleShare()} className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">다른 시계 덕후에게 공유하기</button>
        </div>
        {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
      </section>

      {open && (
        <MuseumLightbox
          piece={open.piece}
          startIndex={open.index}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}
