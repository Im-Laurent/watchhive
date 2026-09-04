import { useState, useRef } from 'react';
import { SEIKO_CALIBERS, type SeikoCaliberRange } from '../data/seikoCalibers';
import KoreanYearNews from './KoreanYearNews';

const MONTHS: Record<number, string> = {
  1: '1월', 2: '2월', 3: '3월', 4: '4월', 5: '5월', 6: '6월',
  7: '7월', 8: '8월', 9: '9월', 10: '10월', 11: '11월', 12: '12월',
};

function decodeMonth(ch: string): { n: number; label: string } | null {
  if (ch >= '1' && ch <= '9') return { n: +ch, label: MONTHS[+ch] };
  if (ch === 'O') return { n: 10, label: '10월' };
  if (ch === 'N') return { n: 11, label: '11월' };
  if (ch === 'D') return { n: 12, label: '12월' };
  return null;
}

const spanTxt = (r: SeikoCaliberRange) => `${r[0]}${r[1] ? '~' + r[1] : '~현재'}`;

type SeikoResult =
  | { kind: 'single'; year: number; monthLabel: string; prod: string; caliber: string; range: SeikoCaliberRange }
  | {
      kind: 'multi';
      monthLabel: string;
      lastDigit: number;
      prod: string;
      candidates: number[];
      reasonKind: 'noCal' | 'notFound' | 'wide';
      caliber: string;
      range?: SeikoCaliberRange;
    };

export default function SeikoYearFinder() {
  const [serial, setSerial] = useState('');
  const [caliber, setCaliber] = useState('');
  const [res, setRes] = useState<SeikoResult | null>(null);
  const [err, setErr] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const lookup = () => {
    setErr('');
    setRes(null);
    const raw = serial.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const cal = caliber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (raw.length < 6 || raw.length > 7) {
      setErr('세이코 시리얼은 보통 6~7자리입니다. 케이스백 번호를 다시 확인해 주세요.');
      return;
    }
    const yChar = raw[0];
    if (yChar < '0' || yChar > '9') {
      setErr('첫 자리는 연도 끝자리(숫자)여야 합니다.');
      return;
    }
    const m = decodeMonth(raw[1]);
    if (!m) {
      setErr('둘째 자리는 월(1~9, 또는 O·N·D)이어야 합니다.');
      return;
    }
    const lastDigit = +yChar;
    const prod = raw.slice(2);
    const calKnown = cal.length > 0;
    const range = calKnown ? SEIKO_CALIBERS[cal] : undefined;
    const calFound = !!range;

    const lo = 1966, hi = 2026;
    let cands: number[] = [];
    for (let y = lo; y <= hi; y++) if (y % 10 === lastDigit) cands.push(y);
    if (calFound && range) {
      const s = range[0], e = range[1] == null ? hi : range[1];
      cands = cands.filter((y) => y >= s && y <= e);
    }

    if (calFound && range && cands.length === 1) {
      setRes({ kind: 'single', year: cands[0], monthLabel: m.label, prod, caliber: cal, range });
    } else {
      const reasonKind: 'noCal' | 'notFound' | 'wide' = !calKnown ? 'noCal' : !calFound ? 'notFound' : 'wide';
      setRes({ kind: 'multi', monthLabel: m.label, lastDigit, prod, candidates: cands, reasonKind, caliber: cal, range });
    }
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <>
      {/* Step 2: serial */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-sm font-bold">2</span>
          <span className="text-lg font-bold text-gray-800">
            <span style={{ fontFamily: "'Marcellus', serif" }}>Seiko</span> 시리얼 번호 입력
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-3 py-1">1966년 이후 모델</span>
          <span className="text-xs text-gray-400">케이스백에 각인된 6~7자리 번호</span>
        </div>
        <input
          type="text"
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          maxLength={8}
          className="border rounded-lg w-full py-3 px-4 text-base mb-1 tracking-widest"
          placeholder="예: 7N0326"
        />
        <p className="text-xs text-gray-400 mb-1">
          첫 자리 = 연도 끝자리 · 둘째 자리 = 월(1~9, O=10 · N=11 · D=12, 문자일 수 있음) · 나머지는 모두 숫자
        </p>

        {/* Step 3: caliber */}
        <div className="flex items-center gap-2 mt-6 mb-3">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-800 text-white text-sm font-bold">3</span>
          <span className="text-lg font-bold text-gray-800">
            무브먼트(칼리버) 번호 <span className="text-sm font-medium text-gray-500">· 입력 권장</span>
          </span>
        </div>
        <input
          type="text"
          value={caliber}
          onChange={(e) => setCaliber(e.target.value)}
          maxLength={6}
          className="border rounded-lg w-full py-3 px-4 text-base mb-1 tracking-widest uppercase"
          placeholder="예: 7S26 · 6139 · 6R15"
        />
        <p className="text-xs text-gray-400 mb-4">
          모델번호(예: <b>6139</b>-6002)의 <b>앞 4자리</b>가 칼리버입니다. 넣으면 연도가 하나로 좁혀질 확률이 크게 올라갑니다. 대소문자 무관 · 칼리버 속 <b>S</b>는 숫자 5와 혼동하기 쉬우니 확인하세요.
        </p>

        <button
          onClick={lookup}
          className="bg-gray-800 hover:bg-gray-700 text-gray-100 font-bold py-3.5 px-4 rounded-full shadow-md w-full transition"
        >
          생산년도 조회
        </button>

        {res && res.kind === 'single' && (
          <div ref={resultRef} className="mt-6">
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">생산년도 <span className="text-green-600">(추정)</span></p>
              <p className="text-5xl font-bold text-green-700 mb-1">{res.year}년</p>
              <p className="text-sm text-gray-600">{res.monthLabel} 생산 · 칼리버 {res.caliber} ({spanTxt(res.range)})로 확정</p>
              <p className="text-xs text-gray-400 mt-1">그 달의 생산 일련번호: {res.prod}</p>
            </div>
            <KoreanYearNews year={res.year} />
          </div>
        )}

        {res && res.kind === 'multi' && (
          <div ref={resultRef} className="mt-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 mb-1">조회 결과 <span className="text-gray-400">(추정)</span></p>
                <p className="text-3xl font-bold text-gray-800">{res.monthLabel} · 끝자리 {res.lastDigit}년</p>
                <p className="text-xs text-gray-400 mt-1">그 달의 생산 일련번호: {res.prod}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm mb-3">
                <p className="text-sm font-bold text-gray-700 mb-2">후보 생산년도</p>
                <div className="flex flex-wrap gap-2">
                  {res.candidates.length ? (
                    res.candidates.map((y) => (
                      <span key={y} className="text-sm font-bold text-gray-800 bg-gray-100 rounded-lg px-3 py-1">{y}년</span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">해당 없음</span>
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-600 bg-white/70 rounded-xl p-4">
                ※{' '}
                {res.reasonKind === 'noCal' && '칼리버를 함께 입력하면 대부분 한 해로 좁혀집니다.'}
                {res.reasonKind === 'notFound' && (
                  <>입력한 칼리버 <b>{res.caliber}</b>는 아직 연도 자료가 없어요. 시리얼만으로 후보를 표시합니다.</>
                )}
                {res.reasonKind === 'wide' && res.range && (
                  <>칼리버 <b>{res.caliber}</b>가 10년 이상 생산돼({spanTxt(res.range)}) 후보가 여러 개입니다. 모델·디자인으로 좁혀 보세요.</>
                )}
              </div>
            </div>
          </div>
        )}

        {err && <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{err}</div>}
      </div>

      {/* Guide */}
      <div className="mt-8 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-800 text-white px-5 py-3 font-semibold">Seiko 시리얼넘버 조회 가이드</div>
        <div className="p-5 space-y-4">
          <div>
            <p className="font-bold text-gray-800 mb-1">| 시리얼·칼리버 번호는 어디에 있나요?</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              모두 케이스백(뒷뚜껑)에 각인돼 있습니다. 6~7자리 <b>시리얼</b>은 첫 자리가 숫자, 둘째 자리는 숫자 또는 O·N·D 문자이며 나머지는 숫자입니다. <b>칼리버</b>는 <span className="tracking-wide">CCCC-XXXX</span> 형태 모델번호의 앞 4자리예요.
            </p>
            <figure className="mt-3">
              <img
                src="/images/seiko_caseback.jpg"
                alt="Seiko 케이스백에서 칼리버와 시리얼 번호 위치 예시"
                loading="lazy"
                className="w-full max-w-md mx-auto rounded-lg border border-gray-200"
                onError={(e) => {
                  const fig = e.currentTarget.closest('figure');
                  if (fig instanceof HTMLElement) fig.style.display = 'none';
                }}
              />
              <figcaption className="text-xs text-gray-400 text-center mt-2">케이스백 예시 — 칼리버(5626)와 시리얼(0N0045)의 위치</figcaption>
            </figure>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">| 왜 칼리버까지 넣나요?</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              세이코 시리얼은 연도의 <b>끝자리</b>만 담고 있어 시리얼만으로는 1972·1982·1992처럼 10년 단위를 가릴 수 없습니다. 칼리버의 생산 시기를 겹쳐 보면 대부분 <b>한 해</b>로 좁혀집니다.
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">| 연도가 여러 개로 나오면?</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              해당 칼리버의 연도 자료가 없거나, 그 무브먼트가 10년 넘게 생산된 경우입니다. 후보 연도 중 모델·디자인으로 좁혀 판단하세요.
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-800 mb-1">| 조회가 어려운 경우</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              2019년 이후 <b>세이코 5 스포츠</b>의 6자리 번호는 생산 일련번호라 연도 판별에 쓸 수 없습니다. 그랜드 세이코·일부 쿼츠·무브먼트를 교체한 개체도 정확하지 않을 수 있어요. 모든 결과는 <b>추정</b>이며 참고용입니다.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
