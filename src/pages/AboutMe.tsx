import PageHead from '../components/PageHead';
import { PAGE_META } from '../data/pageMeta';
import { useShare } from '../hooks/useShare';
import { useClipboard } from '../hooks/useClipboard';
import PageHero from '../components/PageHero';

export default function AboutMe() {
  const { copyToClipboard, copyMessage } = useClipboard();
  const { handleShare, shareMessage } = useShare();

  return (
    <>
      <PageHead {...PAGE_META.aboutMe} />
      {/* 원본이 2048px 이라 확대 없이 만들 수 있는 판이 여기까지다 */}
      <PageHero
        title="About Me"
        subtitle="&ldquo;조금 느릴 수 있지만, 꾸준하게 더 많은 시계 정보와 영상을 전달하는 채널이 되고 싶어요.&rdquo;"
        imgBase="about_me_hero"
        alt="어두운 석판 위에 나란히 놓인 빈티지 시계 일곱 점"
        widths={[800, 1400, 2048]}
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
      </main>
    </>
  );
}
