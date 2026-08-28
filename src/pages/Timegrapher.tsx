import PageHead from '../components/PageHead';
import { PAGE_META } from '../data/pageMeta';
import PageHero from '../components/PageHero';
import TimegrapherTool from '../components/TimegrapherTool';
import { useShare } from '../hooks/useShare';

export default function Timegrapher() {
  const { handleShare, shareMessage } = useShare();

  return (
    <>
      <PageHead {...PAGE_META.timegrapher} />
      {/* 원본이 2704px이라 기본 폭 목록의 2800은 확대가 되므로, 확대 없이 만들 수 있는 폭만 넘긴다. */}
      <PageHero
        title="Timegrapher"
        subtitle="내 시계의 건강 상태를 체크해 보세요"
        imgBase="timegrapher_hero"
        alt="타임그래퍼 스탠드에 물려 있는 금장 빈티지 론진 시계"
        widths={[800, 1400, 2000, 2704]}
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8 max-w-3xl">
        <TimegrapherTool />

        {/* 다른 도구 페이지(Year Finder / Fit Finder / Videos)와 동일한 맺음 섹션.
            시작 화면의 "하단 공유 링크" 안내가 가리키는 곳이기도 하다. */}
        <section className="p-8 text-center">
          <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
            <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noreferrer" className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">YouTube 채널 구독하기</a>
            <button onClick={() => handleShare()} className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">다른 시계 덕후에게 공유하기</button>
          </div>
          {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
        </section>
      </main>
    </>
  );
}
