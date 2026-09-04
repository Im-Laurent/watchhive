import { KOREAN_EVENTS } from '../data/koreanEvents';

// 생산년도와 정확히 같은 해의 대한민국 주요 사건 카드.
// 데이터 범위(1880~2000) 밖이면 아무것도 렌더링하지 않는다.
export default function KoreanYearNews({ year }: { year: number }) {
  const entry = KOREAN_EVENTS[year];
  if (!entry) return null;

  return (
    <div className="text-left bg-white rounded-xl p-4 mt-3 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <p className="font-bold text-gray-700">| {year}년 대한민국</p>
        {entry.era && (
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{entry.era}</span>
        )}
      </div>
      <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm">
        {entry.events.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
