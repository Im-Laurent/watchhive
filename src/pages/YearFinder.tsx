import { useState, useRef } from 'react';
import PageHead from '../components/PageHead';
import { useShare } from '../hooks/useShare';
import { OMEGA_SERIALS } from '../data/serials/omega';
import { ROLEX_SERIALS } from '../data/serials/rolex';
import { IWC_SERIALS } from '../data/serials/iwc';
import { LONGINES_SERIALS } from '../data/serials/longines';
import { UG_SERIALS } from '../data/serials/ug';
import { WATCH_HISTORY, KOREAN_HISTORY } from '../data/history';
import { BRAND_GUIDES } from '../data/brandGuides';

type LookupResult = {
  year: string;
  wFact: typeof WATCH_HISTORY;
  kFact: typeof KOREAN_HISTORY;
};

export default function YearFinder() {
  const [brand, setBrand] = useState('');
  const [serial, setSerial] = useState('');
  const [res, setRes] = useState<LookupResult | null>(null);
  const [err, setErr] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const { handleShare, shareMessage } = useShare('Year Finder', '빈티지 시계 생산년도를 확인해보세요!');

  const lookup = () => {
    setErr('');
    setRes(null);
    const sn = serial.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!sn) {
      setErr('유효한 시리얼 번호를 입력해주세요.');
      return;
    }

    let yearText = '';
    if (brand === 'Omega') {
      const n = parseInt(sn);
      const m = [...OMEGA_SERIALS].reverse().find((i) => n >= i.serial);
      if (m) yearText = `${m.year}년`;
    } else if (brand === 'Rolex') {
      if (sn.startsWith('R')) yearText = '1987년';
      else {
        const n = parseInt(sn);
        const m = ROLEX_SERIALS.find((i) => i.serialStart != null && i.serialEnd != null && n >= i.serialStart && n <= i.serialEnd);
        if (m) yearText = `${m.year}년`;
      }
    } else if (brand === 'IWC') {
      const n = parseInt(sn);
      const foundMatch = IWC_SERIALS.find((i) => i.serialStart != null && i.serialEnd != null && n >= i.serialStart && n <= i.serialEnd);
      if (foundMatch) yearText = `${foundMatch.year}년`;
    } else if (brand === 'Longines') {
      const n = parseInt(sn);
      const m = LONGINES_SERIALS.find((i) => i.serialStart != null && i.serialEnd != null && n >= i.serialStart && n <= i.serialEnd);
      if (m) yearText = `${m.year}년`;
    } else if (brand === 'UniversalGenève') {
      const n = parseInt(sn);
      const m = UG_SERIALS.find((i) => i.serialStart != null && i.serialEnd != null && n >= i.serialStart && n <= i.serialEnd);
      if (m) yearText = `${m.year}년`;
    }

    if (yearText) {
      const yr = parseInt(yearText);
      setRes({
        year: yearText,
        wFact: WATCH_HISTORY.filter((f) => f.brand === brand && Math.abs(f.year - yr) <= 2).slice(0, 2),
        kFact: KOREAN_HISTORY.filter((f) => Math.abs(f.year - yr) <= 2).slice(0, 2),
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else setErr('생산년도를 찾을 수 없습니다.');
  };

  const currentGuide = BRAND_GUIDES[brand];

  return (
    <>
      <PageHead
        title="Year Finder"
        description="브랜드와 시리얼 번호로 빈티지 시계의 생산년도를 조회합니다. Rolex, Omega, IWC, Longines, Universal Genève 지원."
        path="/year-finder"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center mt-4 md:mt-8">Year Finder</h1>
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">빈티지 시계의 생산년도 찾기</h2>
          <p className="text-gray-600 mb-6">내 빈티지 시계의 시리얼넘버로 생산년도를 확인할 수 있어요.</p>
          <div className="mb-6">
            <label className="block text-gray-700 text-base font-bold mb-2">브랜드 선택:</label>
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-base">
              <option value="">-- 브랜드 선택 --</option>
              {Object.keys(BRAND_GUIDES).map((b) => (
                <option key={b} value={b}>{b === 'UniversalGenève' ? 'Universal Genève' : b}</option>
              ))}
            </select>
          </div>
          {brand && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8 border border-gray-200">
              <h3 className="text-xl font-semibold mb-4">{brand} 시리얼 번호 조회</h3>
              <div className="mb-4">
                <label className="block text-gray-700 text-base font-bold mb-2">시리얼 번호 입력:</label>
                <input type="text" value={serial} onChange={(e) => setSerial(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-base" placeholder={brand === 'Rolex' ? '예: 1234567 또는 R000001' : '예: 1234567'} />
              </div>
              <button onClick={lookup} className="bg-gray-800 text-gray-300 font-bold py-3 px-4 rounded-full shadow-md w-full">생산년도 조회</button>
              {res && (
                <div ref={resultRef} className="mt-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-800 rounded-md flex flex-col items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mb-2"><path d="M21 14V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="m16 22 3.5-3.5" /><path d="M22 15l-7 7" /></svg>
                  <p className="font-bold text-xl md:text-2xl">생산년도: <span className="text-green-700">{res.year}</span></p>
                  {res.wFact.length > 0 && (
                    <div className="mt-4 w-full text-left">
                      <p className="font-bold text-lg mb-2">브랜드 시계 역사:</p>
                      <ul className="list-disc list-inside space-y-1 text-base">{res.wFact.map((f, i) => <li key={i}>{f.fact}</li>)}</ul>
                    </div>
                  )}
                  {res.kFact.length > 0 && (
                    <div className="mt-4 w-full text-left">
                      <p className="font-bold text-lg mb-2">주요 한국 역사:</p>
                      <ul className="list-disc list-inside space-y-1 text-base">{res.kFact.map((f, i) => <li key={i}>{f.fact}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
              {err && <div className="mt-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md italic">{err}</div>}
            </div>
          )}
          {currentGuide && (
            <div className="mt-8 p-6 rounded-lg shadow-md relative overflow-hidden text-white" style={{ backgroundImage: `url(${currentGuide.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="absolute inset-0 bg-black opacity-30"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold mb-4">{currentGuide.title}</h3>
                <p className="text-lg leading-relaxed whitespace-pre-line">{currentGuide.description}</p>
              </div>
            </div>
          )}
          <div className="flex justify-center mt-8">
            <img src="/images/year_finder_guide.png" alt="guide" className="max-w-full h-auto rounded-lg shadow-sm grayscale" />
          </div>
        </div>
        <section className="p-8 text-center mt-8">
          <p className="text-gray-700 text-lg mb-6">구독과 공유는 콘텐츠 제작에 큰 힘이 됩니다.</p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 mb-6">
            <a href="https://www.youtube.com/@seemoung?sub_confirmation=1" target="_blank" rel="noreferrer" className="bg-gray-800 text-gray-300 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">YouTube 채널 구독하기</a>
            <button onClick={() => handleShare()} className="bg-gray-800 text-gray-300 font-bold py-3 px-6 rounded-full shadow-md transition duration-300 ease-in-out text-base sm:text-lg w-full sm:w-auto">다른 시계 덕후에게 공유하기</button>
          </div>
          {shareMessage && <div className="mt-4 text-blue-600 text-sm">{shareMessage}</div>}
        </section>
      </main>
    </>
  );
}
