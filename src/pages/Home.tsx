import { useNavigate } from 'react-router-dom';
import PageHead from '../components/PageHead';
import { useShare } from '../hooks/useShare';
import { FEATURED_VIDEO } from '../data/featured';

const SERVICES = [
  { to: '/year-finder', title: 'Year Finder', desc: '시리얼 넘버로 생산년도 확인', img: '/images/year_finder_img.png' },
  { to: '/fit-finder', title: 'Fit Finder', desc: '내 손목에 딱 맞는 시계 사이즈 추천', img: '/images/fit_finder_img.jpg' },
  { to: '/videos', title: 'Videos', desc: '빈티지 시계 리뷰와 시계 헌팅 영상', img: '/images/videos_img.jpg' },
];

export default function Home() {
  const navigate = useNavigate();
  const { handleShare, shareMessage } = useShare();
  const featured = FEATURED_VIDEO;

  return (
    <>
      <PageHead
        title="Watch HIVE"
        description="빈티지 시계 애호가를 위한 공간. Fit Finder와 Year Finder로 나에게 맞는 시계를 찾다."
        path="/"
      />
      <main className="container mx-auto mt-0 px-0 md:px-0 py-0">
        <section className="relative w-full min-h-[400px] md:min-h-[600px] flex items-center justify-center bg-gray-200">
          <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: 'url(/images/home_img.jpg)' }}></div>
          <div className="relative z-10 text-center p-4">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4 tracking-tight">Watch HIVE</h1>
            <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed">시계 사이즈와 생산년도 찾기</p>
            <p className="text-lg md:text-xl text-gray-700 font-medium leading-relaxed mt-2">by 빈시멍</p>
          </div>
        </section>

        <section className="mb-12 px-6 md:px-12 mt-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">제공 서비스</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SERVICES.map((s) => (
              <div
                key={s.to}
                onClick={() => navigate(s.to)}
                className="bg-gray-800 rounded-lg shadow-lg flex flex-col items-center text-center cursor-pointer hover:bg-gray-700 transition duration-300 relative aspect-square group overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: `url(${s.img})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }}></div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full w-full p-8">
                  <h4 className="text-3xl font-bold text-white mb-3 group-hover:scale-105 transition-transform duration-300">{s.title}</h4>
                  <p className="text-lg text-gray-200 mb-8 opacity-90">{s.desc}</p>
                  <button className="bg-white text-gray-900 font-bold py-2.5 px-6 rounded-full shadow-md hover:bg-gray-200 transition-colors duration-200 flex items-center">
                    바로가기
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
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
