import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAnalyticsPageview } from '../hooks/useAnalyticsPageview';
import { useClipboard } from '../hooks/useClipboard';
import PullToRefresh from './PullToRefresh';

// Home 메뉴는 따로 두지 않고 맨 왼쪽의 Watch HIVE 가 그 자리를 대신한다.
const HOME = { to: '/', label: 'Watch HIVE', end: true };

// 데스크톱 헤더 · 모바일 메뉴 · 푸터가 모두 이 순서를 그대로 쓴다.
const NAV = [
  { to: '/timegrapher', label: 'Timegrapher', end: false },
  { to: '/year-finder', label: 'Year Finder', end: false },
  { to: '/fit-finder', label: 'Fit Finder', end: false },
  { to: '/museum', label: 'Museum', end: false },
  { to: '/videos', label: 'Videos', end: false },
  { to: '/about-me', label: 'About Me', end: false },
];

// 데스크톱 헤더에서는 Watch HIVE 를 가운데 두고 좌우로 셋씩 가른다.
// 왼쪽은 재 주는 도구, 오른쪽은 보는 것 — 순서를 바꾸지 않고 딱 반으로 갈리는 자리다.
// 모바일 메뉴와 푸터는 계속 NAV 를 통째로 순서대로 쓴다.
const SPLIT = 3;
const NAV_LEFT = NAV.slice(0, SPLIT);
const NAV_RIGHT = NAV.slice(SPLIT);

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-lg font-medium whitespace-nowrap ${isActive ? 'underline underline-offset-4 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`;

export default function Layout() {
  useAnalyticsPageview();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { copyToClipboard, copyMessage } = useClipboard();
  const copyEmail = () =>
    copyToClipboard('watch.hive.biz@gmail.com', '이메일 주소가 클립보드에 복사되었습니다!');

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Rajdhani', 'Noto Sans', sans-serif" }}>
      <PullToRefresh />
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-12">
        {/* 데스크톱: [도구 셋] Watch HIVE [볼거리 셋]. 양옆 nav 에 flex-1 을 줘서
            두 무리의 폭이 달라도 로고가 가운데에 선다.
            모바일: nav 둘이 숨으면 남는 건 로고와 햄버거뿐이라 양 끝으로 갈린다.
            메뉴가 6개라 md 폭에서는 간격을 좁혀야 한 줄에 들어간다. */}
        <div className="container mx-auto flex items-center justify-between gap-6 md:gap-8 lg:gap-12">
          <nav className="hidden md:flex flex-1 items-center justify-end space-x-5 lg:space-x-8 xl:space-x-10">
            {NAV_LEFT.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to={HOME.to}
            end={HOME.end}
            className={({ isActive }) =>
              `text-2xl font-bold text-gray-800 whitespace-nowrap shrink-0 ${isActive ? 'underline underline-offset-4' : ''}`
            }
          >
            {HOME.label}
          </NavLink>

          <nav className="hidden md:flex flex-1 items-center justify-start space-x-5 lg:space-x-8 xl:space-x-10">
            {NAV_RIGHT.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            className="md:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white bg-opacity-95 z-50 flex flex-col items-center justify-center space-y-8">
          <button className="absolute top-4 right-4 text-gray-800" onClick={() => setIsMobileMenuOpen(false)} aria-label="메뉴 닫기">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
          {/* 오버레이가 헤더를 덮으므로 홈으로 가는 Watch HIVE 도 여기 넣는다 */}
          <NavLink
            to={HOME.to}
            end={HOME.end}
            className="text-3xl text-gray-800 font-bold"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {HOME.label}
          </NavLink>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="text-2xl text-gray-800 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* Pages */}
      <Outlet />

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8 px-6 md:px-12 rounded-t-lg">
        {/* 모바일에서는 3단이 1단으로 접히면서 푸터만 화면 하나를 차지했다(320px에서 91%).
            블록 간격·제목 여백을 좁히고, 아래 두 그룹을 각각 가로로 펴서 높이를 줄인다.
            md 이상은 예전 그대로다. */}
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h4 className="text-white font-semibold mb-3 md:mb-4">Watch HIVE</h4>
            <p className="text-sm">A space for vintage watch enthusiasts. Stay a while and enjoy your time here.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3 md:mb-4">Quick Links</h4>
            {/* 6개를 세로로 쌓으면 여기서만 200px을 먹는다. 모바일은 2열(행 우선이라 헤더와
                같은 순서로 읽힌다), 데스크톱은 3단 그리드 안이라 예전처럼 1열로 둔다. */}
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm md:block md:space-y-2">
              {[HOME, ...NAV].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {/* 아이콘 3개를 위해 제목 두 개가 세로로 서 있었다. 모바일에서만 나란히 놓는다. */}
            <div className="grid grid-cols-2 gap-4 md:block">
              <div>
                <h4 className="text-white font-semibold mb-3 md:mb-4">Follow Me</h4>
                <div className="flex space-x-4 md:mb-6">
                  <a href="https://www.youtube.com/@seemoung" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
                  </a>
                  <a href="https://www.instagram.com/seemoung_vtg" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3 md:mb-4">Contact Me</h4>
                <div className="flex space-x-4">
                  <button onClick={copyEmail} className="hover:text-white focus:outline-none" aria-label="이메일 복사">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
            {copyMessage && <div className="mt-2 p-2 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md text-sm">{copyMessage}</div>}
          </div>
        </div>
        <div className="border-t border-gray-700 mt-6 pt-5 md:mt-8 md:pt-6 text-center text-sm">
          &copy; {new Date().getFullYear()} Watch HIVE by 빈시멍. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
