import PageHead from '../components/PageHead';
import { PAGE_META } from '../data/pageMeta';
import { useShare } from '../hooks/useShare';
import { useClipboard } from '../hooks/useClipboard';
import PageHero from '../components/PageHero';

// 출연·인터뷰. 썸네일은 각 매체 페이지의 대표 이미지를 받아 16:9 로 맞춰 둔 것.
// (인스타그램 CDN 주소는 서명이 만료되므로 직접 호스팅한다 — public/images/press)
// desc 는 한 줄 소개 — 본인이 직접 쓴 문장이니 임의로 바꾸지 말 것.
const PRESS = [
  {
    title: '데프콘TV 출연',
    desc: '『데프콘TV』에서 합치면 900살 시계 컬렉션을 소개합니다.',
    outlet: 'YouTube',
    url: 'https://youtu.be/Dc35ugMpGpM',
    img: 'press_defcon',
    video: true,
  },
  {
    title: '트렌드 코리아 2027 인터뷰',
    desc: '『트렌드 코리아 2027』에 안목에 대한 인터뷰가 실렸습니다.',
    outlet: 'Instagram',
    url: 'https://www.instagram.com/p/Dd_xrI5E7_c/',
    img: 'press_trendkorea',
  },
  {
    title: '맨노블레스 인터뷰',
    desc: '『맨노블레스』와 몇 점의 컬렉션을 소개합니다.',
    outlet: 'Instagram',
    url: 'https://www.instagram.com/p/DftTGtBE5aB/',
    img: 'press_mnoblesse',
  },
  {
    title: '임볼든 인터뷰',
    desc: '『임볼든』과 워치헌팅에 대한 이야기를 나눴습니다.',
    outlet: 'IMBOLDN',
    url: 'https://kr.imboldn.com/digest/%eb%b9%88%ec%8b%9c%eb%a9%8d%ec%9d%b4-%ec%95%8c%eb%a0%a4%ec%a3%bc%eb%8a%94-%eb%b9%88%ed%8b%b0%ec%a7%80-%ec%8b%9c%ea%b3%84%ec%9d%98-%eb%aa%a8%eb%93%a0-%ea%b2%83/',
    img: 'press_imboldn',
  },
];

export default function AboutMe() {
  const { copyToClipboard, copyMessage } = useClipboard();
  const { handleShare, shareMessage } = useShare();

  return (
    <>
      <PageHead {...PAGE_META.aboutMe} />
      <PageHero
        title="About Me"
        subtitle="&ldquo;조금 느릴 수 있지만, 꾸준하게 더 많은 시계 정보와 영상을 전달하는 채널이 되고 싶어요.&rdquo;"
        imgBase="about_me_hero"
        alt="짙은 판 위에 손으로 찢어 겹쳐 놓은 핸드메이드 종이"
      />
      <main className="container mx-auto mt-8 px-0 md:px-0 py-8">
        <section className="mb-12 text-center max-w-4xl mx-auto px-6 md:px-12">
          <p className="text-gray-700 text-lg leading-relaxed mb-4">안녕하세요! 시계 애호가 빈시멍 입니다.<br />취미를 나누고자 유튜브 채널 빈시멍을 시작했고</p>
          <p className="text-gray-700 text-lg leading-relaxed mb-8">특히 빈티지 시계 문화를 더 많은 분들과 공유하고 즐기고 싶은 마음으로<br />1인 영상 콘텐츠와 서비스를 만들어가고 있습니다.</p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">Watch Hive는<br />저와 같은 애호가 분들은 물론<br />현행 시계나 애플 워치를 착용하는 분들<br />그리고 막 시계에 관심을 갖기 시작한 모든 분들을 위한 공간입니다.</p>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">이 곳의 모든 콘텐츠는 무료이니<br />누구나 자유롭게 이용하고, 편히 머물다 가시면 좋겠습니다.</p>
        </section>

        {/* 편지의 맺음말 자리 — 위 본문과 한 덩어리로 읽히도록 붙여 둔다. */}
        <section className="text-center mb-8 px-6 md:px-12">
          <img
            src="/images/standing-checking-watch.svg"
            alt="손목시계를 확인하는 사람 일러스트"
            width={128}
            height={160}
            className="mx-auto h-40 w-auto"
          />
          <p className="text-gray-700 text-lg mt-5">빈시멍 드림</p>
        </section>

        <section className="p-8 text-center w-full px-6 md:px-12">
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-8">
            <a href="https://www.youtube.com/@seemoung" target="_blank" rel="noreferrer" className="flex flex-col items-center text-gray-800 hover:text-blue-600 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
              <span className="block text-base font-medium mt-2">YouTube</span>
            </a>
            <a href="https://www.instagram.com/seemoung_vtg" target="_blank" rel="noreferrer" className="flex flex-col items-center text-gray-800 hover:text-pink-600 transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              <span className="block text-base font-medium mt-2">Instagram</span>
            </a>
            <button onClick={() => handleShare({ url: 'https://watch-hive.com/' })} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>
              <span className="block text-base font-medium mt-2">Share</span>
            </button>
            <button onClick={() => copyToClipboard('watch.hive.biz@gmail.com', '이메일 주소가 복사되었습니다!')} className="flex flex-col items-center text-gray-800 hover:text-green-600 focus:outline-none transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              <span className="block text-base font-medium mt-2">Email</span>
            </button>
          </div>
          {(copyMessage || shareMessage) && <div className="mt-4 p-3 bg-blue-100 border-l-4 border-blue-500 text-blue-800 rounded-md text-sm">{copyMessage || shareMessage}</div>}
        </section>

        <section className="mb-12 px-6 md:px-12">
          <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Press</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 max-w-5xl mx-auto">
            {PRESS.map((item) => (
              <a
                key={item.url}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-800 focus-visible:ring-offset-2 rounded-lg"
              >
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200 shadow-md">
                  <picture>
                    <source type="image/webp" srcSet={`/images/press/${item.img}.webp`} />
                    <img
                      src={`/images/press/${item.img}.jpg`}
                      alt={item.title}
                      loading="lazy"
                      width={1200}
                      height={675}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </picture>
                  {item.video && (
                    /* 영상이라는 걸 hover 없이도 알 수 있게 — 모바일에는 hover 가 없다 */
                    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-black/55 backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                      </span>
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{item.outlet}</p>
                <h4 className="text-lg font-semibold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </a>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
