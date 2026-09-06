import { useState, useRef } from 'react';
import PageHead from '../components/PageHead';
import { PAGE_META } from '../data/pageMeta';
import { lookupYear, normalizeSerial } from '../data/serials/lookup';
import { WATCH_HISTORY } from '../data/history';
import { BRAND_GUIDES } from '../data/brandGuides';
import SeikoYearFinder from '../components/SeikoYearFinder';
import KoreanYearNews from '../components/KoreanYearNews';
import PageHero from '../components/PageHero';
import SubscribeShare from '../components/SubscribeShare';

type LookupResult = {
  year: string;
  yearNum: number;
  wFact: typeof WATCH_HISTORY;
};

// 브랜드별 지원 연도 범위 (배지·안내용)
const YEAR_RANGE: Record<string, string> = {
  Rolex: '1954–1987',
  Omega: '1895–1989',
  IWC: '1884–1975',
  Longines: '1867–1969',
  UniversalGenève: '1930–1967',
  Seiko: '1966+ 추정',
};

const displayName = (brand: string) => (brand === 'UniversalGenève' ? 'Universal Genève' : brand);

// 브랜드 카드 목록: 시리얼 테이블 브랜드(BRAND_GUIDES) + Seiko(시리얼×칼리버 별도 조회)
const BRAND_CARDS = [...Object.keys(BRAND_GUIDES), 'Seiko'];

export default function YearFinder() {
  const [brand, setBrand] = useState('');
  const [serial, setSerial] = useState('');
  const [res, setRes] = useState<LookupResult | null>(null);
  const [err, setErr] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const selectBrand = (b: string) => {
    setBrand(b);
    setSerial('');
    setRes(null);
    setErr('');
  };

  const lookup = () => {
    setErr('');
    setRes(null);
    const sn = normalizeSerial(serial);
    if (!sn) {
      setErr('유효한 시리얼 번호를 입력해주세요.');
      return;
    }

    const yearText = lookupYear(brand, sn);

    if (yearText) {
      const yr = parseInt(yearText);
      setRes({
        year: yearText,
        yearNum: yr,
        wFact: WATCH_HISTORY.filter((f) => f.brand === brand && Math.abs(f.year - yr) <= 2).slice(0, 2),
      });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } else {
      setErr(`생산년도를 찾을 수 없습니다. ${displayName(brand)}는 ${YEAR_RANGE[brand]} 범위의 시리얼만 조회할 수 있어요.`);
    }
  };

  const currentGuide = BRAND_GUIDES[brand];
  // brandGuides.description은 "질문\n답변" 블록이 빈 줄로 구분된 형식 → Q&A 카드로 파싱
  const guideBlocks = currentGuide
    ? currentGuide.description.split('\n\n').map((block) => {
        const [question, ...rest] = block.split('\n');
        return { question, answer: rest.join('\n') };
      })
    : [];

  return (
    <>
      <PageHead {...PAGE_META.yearFinder} />
      <PageHero
        title="Year Finder"
        subtitle="시리얼 넘버로 빈티지 시계의 생산년도를 조회해 보세요"
        imgBase="year_finder_hero"
        alt="빨간 까르띠에 박스와 책 위에 놓인 빈티지 까르띠에 시계 세 점"
      />
      <main className="container mx-auto mt-8 px-6 md:px-12 py-8 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-8 mb-8">
          {/* Step 1: brand cards */}
          <div className="flex items-center gap-2 mb-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-sm font-bold">1</span>
            <span className="text-lg font-bold text-gray-800">브랜드 선택</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BRAND_CARDS.map((b) => {
              const on = brand === b;
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => selectBrand(b)}
                  className={`p-4 rounded-xl border-2 text-center transition ${
                    on ? 'border-gray-800 bg-gray-50 ring-2 ring-gray-800' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <p className="text-lg text-gray-800 mb-1" style={{ fontFamily: "'Marcellus', serif" }}>{displayName(b)}</p>
                  <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{YEAR_RANGE[b]}</span>
                </button>
              );
            })}
          </div>

          {/* Seiko: 시리얼×칼리버 별도 조회 */}
          {brand === 'Seiko' && <SeikoYearFinder />}

          {/* Step 2: serial input (시리얼 테이블 브랜드) */}
          {brand && brand !== 'Seiko' && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-sm font-bold">2</span>
                <span className="text-lg font-bold text-gray-800">
                  <span style={{ fontFamily: "'Marcellus', serif" }}>{displayName(brand)}</span> 시리얼 번호 입력
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1">지원 연도 {YEAR_RANGE[brand]}</span>
              </div>
              <input
                type="text"
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="border rounded-lg w-full py-3 px-4 text-base mb-4"
                placeholder={brand === 'Rolex' ? '예: 1234567 또는 R000001' : '예: 1234567'}
              />
              <button onClick={lookup} className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3.5 px-4 rounded-full shadow-md w-full transition">
                생산년도 조회
              </button>

              {res && (
                <div ref={resultRef} className="mt-6">
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
                    <p className="text-sm text-gray-500 mb-1">생산년도</p>
                    <p className="text-5xl font-bold text-green-700 mb-4">{res.year}</p>
                    {res.wFact.length > 0 && (
                      <div className="text-left bg-white rounded-xl p-4 mb-3 shadow-sm">
                        <p className="font-bold text-gray-700 mb-2">| 브랜드 시계 역사</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">{res.wFact.map((f, i) => <li key={i}>{f.fact}</li>)}</ul>
                      </div>
                    )}
                    <KoreanYearNews year={res.yearNum} />
                  </div>
                </div>
              )}
              {err && <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{err}</div>}
            </div>
          )}

          {/* Guide */}
          {currentGuide && (
            <div className="mt-8 rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-800 text-white px-5 py-3 font-semibold">{currentGuide.title}</div>
              <div className="p-5 space-y-4">
                {guideBlocks.map((blk, i) => (
                  <div key={i}>
                    <p className="font-bold text-gray-800 mb-1">{blk.question}</p>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{blk.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SubscribeShare shareTitle="Year Finder" shareText="빈티지 시계 생산년도를 확인해보세요!" />
      </main>
    </>
  );
}
