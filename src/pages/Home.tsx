import { Link } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { PAGE_META } from '../data/pageMeta';
import { useShare } from '../hooks/useShare';
import { FEATURED_VIDEO } from '../data/featured';

const SERVICES = [
  { to: '/timegrapher', title: 'Timegrapher', desc: '세계에서 가장 간편한 시계 진단', img: '/images/timegrapher_img.jpg' },
  { to: '/year-finder', title: 'Year Finder', desc: '시리얼 넘버로 생산년도 확인', img: '/images/year_finder_img.png' },
  { to: '/fit-finder', title: 'Fit Finder', desc: '내 손목에 딱 맞는 시계 사이즈 추천', img: '/images/fit_finder_img.jpg' },
  { to: '/videos', title: 'Videos', desc: '빈티지 시계 리뷰와 시계 헌팅 영상', img: '/images/videos_img.jpg' },
];

export default function Home() {
  const { handleShare, shareMessage } = useShare();
  const featured = FEATURED_VIDEO;

  return (
    <>
      <PageHead {...PAGE_META.home} />
      {/* 명판은 다른 페이지(PageHero)와 마찬가지로 화면 폭을 꽉 채운다. 그래서 폭이 묶이는
          container 밖, main 앞에 둔다 -- 안에 있을 때는 넓은 화면에서 명판만 가운데
          토막으로 잘려 나머지 페이지와 어긋났다. 높이는 처음의 63%. */}
      <section className="relative w-full min-h-[252px] md:min-h-[378px] flex items-center justify-center bg-gray-200 overflow-hidden">
        {/* 세로로 넘치는 만큼은 위에서만 덜어낸다 -- 가운데(50%)로 두면 명판을 줄일 때마다
            아래 시계들이 같이 잘려 나간다. 16:9 사진을 흔한 PC 폭에 얹었을 때 아래 끝이
            그대로 남는 값이 54% 근처다. */}
        <div className="absolute inset-0 bg-cover opacity-70" style={{ backgroundImage: 'url(/images/home_img.jpg)', backgroundPosition: 'center 54%' }}></div>
        <div className="relative z-10 text-center p-4">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4 tracking-tight">Watch HIVE</h1>
          <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed">by 빈시멍</p>
        </div>
      </section>

      <main className="container mx-auto mt-0 px-0 md:px-0 py-0">
        <section className="mb-12 px-6 md:px-12 mt-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">제공 서비스</h3>
          {/* 카드는 가로로 긴 4:3. 폭이 좁아 4:3 높이로는 제목·설명이 안 들어가는
              구간이 있어 최소 높이를 함께 둔다. 카드가 4개라 3단으로 두면 마지막 한 장만
              다음 줄에 남으므로, 2단(md·lg) → 4단(xl)으로 항상 줄이 꽉 차게 한다. */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
            {/* 카드 전체가 하나의 링크다. 예전에는 div 의 onClick 이었는데, 그러면 탭으로 닿지도
                않고 Enter 로 열 수도 없었다. 게다가 그 안에 <button> 이 들어 있어 "누를 수 있는 것
                안에 누를 수 있는 것"이 겹쳐 있었다. Link 로 바꾸면 키보드·새 탭으로 열기·크롤러가
                모두 그냥 따라온다. */}
            {SERVICES.map((s) => (
              <Link
                key={s.to}
                to={s.to}
                className="bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center hover:bg-gray-700 transition duration-300 relative w-full aspect-[4/3] min-h-[16rem] group overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }}></div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-8">
                  <h4 className="text-3xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300">{s.title}</h4>
                  <p className="text-lg text-gray-200 mb-8 opacity-90">{s.desc}</p>
                  {/* 카드가 곧 링크라 이건 눌리는 요소가 아니라 눌러 보이는 표시다. */}
                  <span className="bg-white text-gray-900 font-bold py-2.5 px-6 rounded-full shadow-md group-hover:bg-gray-200 transition-colors duration-200 flex items-center">
                    바로가기
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="p-8 rounded-lg shadow-lg text-center w-full px-6 md:px-12 bg-transparent">
          <h3 className="text-3xl font-bold text-gray-800 mb-6 text-center">추천 영상</h3>
          {featured && (
            <div className="max-w-4xl mx-auto mb-10">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${featured.youtubeId}`}
                    title={featured.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  ></iframe>
                </div>
                <div className="p-6 text-left">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{featured.title}</h4>
                  <p className="text-gray-600 text-lg">{featured.description}</p>
                </div>
              </div>
            </div>
          )}

          <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
            <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0 2 2 0 0 1 1.4 1.4 24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0 2 2 0 0 1-1.4-1.4Z" /><path d="m10 15 5-3-5-3z" /></svg>
              YouTube 채널 구독하기
            </a>
            <button onClick={() => handleShare()} className="inline-flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
              다른 시계 덕후에게 공유하기
            </button>
          </div>
          {shareMessage && <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-md text-sm">{shareMessage}</div>}
        </section>
      </main>
    </>
  );
}
