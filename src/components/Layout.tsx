import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAnalyticsPageview } from '../hooks/useAnalyticsPageview';
import { useClipboard } from '../hooks/useClipboard';

// Home 메뉴는 따로 두지 않고 가운데의 Watch HIVE 가 그 자리를 대신한다.
const HOME = { to: '/', label: 'Watch HIVE', end: true };

// 데스크톱 헤더는 [왼쪽 메뉴] Watch HIVE [오른쪽 메뉴] 로 나뉜다.
const NAV_LEFT = [
  { to: '/year-finder', label: 'Year Finder', end: false },
  { to: '/fit-finder', label: 'Fit Finder', end: false },
];
// Vintage Maps 는 개발 전용(App.tsx 의 라우트 가드와 짝). 프로덕션 빌드에서는
// import.meta.env.DEV 가 false 로 치환되어 메뉴·푸터 어디에도 노출되지 않는다.
const NAV_RIGHT = [
  { to: '/about-me', label: 'About Me', end: false },
  { to: '/videos', label: 'Videos', end: false },
  ...(import.meta.env.DEV ? [{ to: '/vintage-maps', label: 'Vintage Maps', end: false }] : []),
];
// 모바일 메뉴·푸터처럼 한 줄로 늘어놓는 곳
const NAV = [...NAV_LEFT, ...NAV_RIGHT];

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-lg font-medium ${isActive ? 'underline underline-offset-4 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`;

export default function Layout() {
  useAnalyticsPageview();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { copyToClipboard, copyMessage } = useClipboard();
  const copyEmail = () =>
    copyToClipboard('watch.hive.biz@gmail.com', '이메일 주소가 클립보드에 복사되었습니다!');

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Rajdhani', 'Noto Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 md:px-12">
        {/* 모바일은 [Watch HIVE ... 햄버거], 데스크톱은 가운데 열이 Watch HIVE 인 3열.
            양쪽 1fr 이 같은 폭이라 Watch HIVE 가 화면 정중앙에 온다. */}
        <div className="container mx-auto flex items-center justify-between md:grid md:grid-cols-[1fr_auto_1fr] md:gap-8 lg:gap-16 xl:gap-20">
          <nav className="hidden md:flex justify-end items-center space-x-8 lg:space-x-12">
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
              `text-2xl font-bold text-gray-800 whitespace-nowrap ${isActive ? 'underline underline-offset-4' : ''}`
            }
          >
            {HOME.label}
          </NavLink>

          <nav className="hidden md:flex justify-start items-center space-x-8 lg:space-x-12">
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
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-white font-semibold mb-4">Watch HIVE</h4>
            <p className="text-sm">A space for vintage watch enthusiasts. Stay a while and enjoy your time here.</p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[HOME, ...NAV].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4">Follow Me</h4>
            <div className="flex space-x-4 mb-6">
              <a href="https://www.youtube.com/@seemoung" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" /></svg>
              </a>
              <a href="https://www.instagram.com/seemoung_vtg" target="_blank" rel="noopener noreferrer" className="hover:text-white" aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
              </a>
            </div>
            <h4 className="text-white font-semibold mb-4">Contact Me</h4>
            <div className="flex space-x-4">
              <button onClick={copyEmail} className="hover:text-white focus:outline-none" aria-label="이메일 복사">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </button>
            </div>
            {copyMessage && <div className="mt-2 p-2 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md text-sm">{copyMessage}</div>}
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm">
          &copy; {new Date().getFullYear()} Watch HIVE by 빈시멍. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
